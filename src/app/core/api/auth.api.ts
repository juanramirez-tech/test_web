import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API } from './api.endpoints';
import { LoginRequest, LoginResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(API.login, body, { skipAuth: true });
  }
}
