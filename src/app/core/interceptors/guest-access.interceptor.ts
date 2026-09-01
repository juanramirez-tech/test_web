import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { USE_GUEST_ACCESS } from '../api/http-contexts';
import { GuestAccess } from '../guest/guest-access';

export const guestAccessInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(USE_GUEST_ACCESS)) {
    return next(req);
  }

  const code = inject(GuestAccess).code();
  if (!code || req.headers.has('X-Access-Code')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Access-Code': code } }));
};
