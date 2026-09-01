import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API } from './api.endpoints';
import { HealthResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class HealthApi {
  private readonly api = inject(ApiClient);

  check(): Observable<HealthResponse> {
    return this.api.get<HealthResponse>(API.health, { skipAuth: true });
  }
}
