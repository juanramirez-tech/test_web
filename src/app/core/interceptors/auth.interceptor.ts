import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SKIP_AUTH } from '../api/http-contexts';
import { isOwnApiUrl } from '../api/api-url';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isOwnApiUrl(req.url)) {
    return next(req);
  }

  let headers = req.headers;

  if (!headers.has('Accept')) {
    headers = headers.set('Accept', 'application/json');
  }

  if (!req.context.get(SKIP_AUTH)) {
    const token = inject(AuthService).token();
    if (token && !headers.has('Authorization')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return next(
    req.clone({
      headers,
      withCredentials: false,
    }),
  );
};
