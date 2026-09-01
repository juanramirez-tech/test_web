import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { ApiError } from '../api/api-error';
import { AppRole, LoginRequest } from '../api/api.models';
import { AuthSession, toAuthSession } from './jwt.util';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(TokenStorage);
  private readonly router = inject(Router);
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly sessionState = signal<AuthSession | null>(this.restore());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => {
    const current = this.sessionState();
    return Boolean(current && Date.now() < current.expiresAt);
  });
  readonly email = computed(() => this.sessionState()?.email ?? null);
  readonly role = computed(() => this.sessionState()?.role ?? null);

  constructor() {
    this.armExpiry(this.sessionState(), false);
    this.storage.changes$.subscribe((change) => {
      if (change === 'cleared') {
        this.clearLocalSession();
        void this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
        return;
      }
      this.sessionState.set(this.restore());
      this.armExpiry(this.sessionState());
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.sessionState() && !this.token()) {
          this.logout(true, 'expired');
        }
      });
    }
  }

  token(): string | null {
    return this.validSession()?.token ?? null;
  }

  hasRole(role: AppRole): boolean {
    return this.validSession()?.role === role;
  }

  login(credentials: LoginRequest): Observable<AuthSession> {
    const email = credentials.email.trim();
    const password = credentials.password;

    return this.api.login({ email, password }).pipe(
      map((response) => this.acceptAdminToken(response.token)),
      tap((session) => {
        this.sessionState.set(session);
        this.armExpiry(session);
      }),
    );
  }

  logout(redirect = true, reason?: 'expired' | 'forbidden'): void {
    this.clearLocalSession();
    if (redirect) {
      void this.router.navigate(['/login'], {
        queryParams: reason ? { reason } : {},
      });
    }
  }

  private validSession(): AuthSession | null {
    const current = this.sessionState();
    if (!current) {
      return null;
    }
    if (Date.now() >= current.expiresAt) {
      this.clearLocalSession();
      return null;
    }
    return current;
  }

  private restore(): AuthSession | null {
    const stored = this.storage.read();
    if (!stored) {
      return null;
    }

    const session = toAuthSession(stored.token);
    if (!session || session.role !== 'admin') {
      this.storage.clear();
      return null;
    }

    this.storage.write(session);
    return session;
  }

  private acceptAdminToken(token: string): AuthSession {
    const session = toAuthSession(token);
    if (!session) {
      throw new ApiError(401, 'Token de sesión inválido o expirado');
    }
    if (session.role !== 'admin') {
      throw new ApiError(403, 'Esta aplicación es solo para administradores');
    }
    this.storage.write(session);
    return session;
  }

  private armExpiry(session: AuthSession | null, redirect = true): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (!session) {
      return;
    }
    const delay = session.expiresAt - Date.now();
    if (delay <= 0) {
      this.logout(redirect, 'expired');
      return;
    }
    this.expiryTimer = setTimeout(() => this.logout(true, 'expired'), delay);
  }

  private clearLocalSession(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    this.storage.clear();
    this.sessionState.set(null);
  }
}
