import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH, USE_GUEST_ACCESS } from './http-contexts';

export type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number | boolean)[] | null | undefined
>;

export interface ApiRequestOptions {
  params?: QueryParams;
  skipAuth?: boolean;
  useGuestAccess?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.url(path), this.httpOptions(options));
  }

  post<T>(path: string, body: unknown = {}, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, this.httpOptions(options));
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<T>(this.url(path), body, this.httpOptions(options));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.url(path), body, this.httpOptions(options));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.url(path), this.httpOptions(options));
  }

  url(path: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  private httpOptions(options?: ApiRequestOptions) {
    let context = new HttpContext();
    if (options?.skipAuth) {
      context = context.set(SKIP_AUTH, true);
    }
    if (options?.useGuestAccess) {
      context = context.set(USE_GUEST_ACCESS, true);
    }

    return {
      context,
      params: this.toParams(options?.params),
    };
  }

  private toParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
