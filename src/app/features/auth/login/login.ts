import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { isValidEmail, passwordClientError } from '../../../core/auth/credentials';
import { safeInternalUrl } from '../../../core/security/safe-internal-url';
import { PageMeta } from '../../../core/seo/page-meta';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly hint = this.hintFromReason(this.route.snapshot.queryParamMap.get('reason'));

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    inject(PageMeta).privatePage('Admin · Iniciar sesión');
  }

  protected submit(): void {
    this.formError.set(null);
    this.form.markAllAsTouched();

    const email = this.form.controls.email.value.trim();
    const password = this.form.controls.password.value;

    if (!isValidEmail(email)) {
      this.formError.set('Ingresa un correo válido');
      return;
    }

    const passwordError = passwordClientError(password);
    if (passwordError) {
      this.formError.set(passwordError);
      return;
    }

    this.submitting.set(true);
    this.auth
      .login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigateByUrl(this.destination());
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.formError.set(this.messageFrom(error));
        },
      });
  }

  private destination(): string {
    return safeInternalUrl(this.route.snapshot.queryParamMap.get('returnUrl')) ?? '/admin';
  }

  private hintFromReason(reason: string | null): string | null {
    if (reason === 'expired') {
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    }
    if (reason === 'forbidden') {
      return 'Esta aplicación es solo para administradores.';
    }
    return null;
  }

  private messageFrom(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof HttpErrorResponse) {
      return 'No se pudo iniciar sesión';
    }
    return 'No se pudo iniciar sesión';
  }
}
