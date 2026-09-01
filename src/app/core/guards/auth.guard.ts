import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { safeInternalUrl } from '../security/safe-internal-url';

/** Solo UX. La autorización real la aplica el backend (JWT + rol admin). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = safeInternalUrl(state.url);
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl ? { returnUrl } : {},
  });
};

/** Solo UX. Un JWT falso con role=admin puede abrir la UI; la API lo rechaza. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasRole('admin')) {
    return true;
  }

  auth.logout(false);
  return router.createUrlTree(['/login'], { queryParams: { reason: 'forbidden' } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.hasRole('admin')) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};
