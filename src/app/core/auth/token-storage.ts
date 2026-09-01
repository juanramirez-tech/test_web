import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthSession } from './jwt.util';

export const SESSION_STORAGE_KEY = 'ta.session';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private memory: AuthSession | null = null;
  private readonly externalChanges = new Subject<'cleared' | 'updated'>();

  readonly changes$: Observable<'cleared' | 'updated'> = this.externalChanges.asObservable();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== SESSION_STORAGE_KEY) {
        return;
      }
      if (event.newValue === null) {
        this.memory = null;
        this.externalChanges.next('cleared');
        return;
      }
      this.memory = null;
      this.externalChanges.next('updated');
    });
  }

  read(): AuthSession | null {
    if (this.memory) {
      return this.memory;
    }

    const raw = this.readRaw();
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.token || typeof parsed.expiresAt !== 'number') {
        this.clear();
        return null;
      }
      this.memory = parsed;
      return parsed;
    } catch {
      this.clear();
      return null;
    }
  }

  write(session: AuthSession): void {
    this.memory = session;
    this.writeRaw(JSON.stringify(session));
  }

  clear(): void {
    this.memory = null;
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Navegación privada o storage bloqueado.
    }
  }

  private readRaw(): string | null {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeRaw(value: string): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, value);
    } catch {
      // La sesión sigue en memoria durante esta pestaña.
    }
  }
}
