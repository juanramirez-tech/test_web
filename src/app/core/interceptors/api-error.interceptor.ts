import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toApiError } from '../api/api-error';
import { isLoginApiUrl } from '../api/api-url';
import { AuthService } from '../auth/auth.service';
import { safeInternalUrl } from '../security/safe-internal-url';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const apiError = toApiError(
        error.status,
        error.error,
        error.statusText,
        error.headers.get('Retry-After'),
      );

      if (apiError.isUnauthorized && !isLoginApiUrl(req.url) && auth.isAuthenticated()) {
        const returnUrl = safeInternalUrl(router.url);
        auth.logout(false);
        void router.navigate(['/login'], {
          queryParams: {
            reason: 'expired',
            ...(returnUrl ? { returnUrl } : {}),
          },
        });
      }

      return throwError(() => apiError);
    }),
  );
};
