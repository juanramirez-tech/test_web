import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API } from './api.endpoints';
import { Court, CourtWrite } from './api.models';

@Injectable({ providedIn: 'root' })
export class AdminCourtsApi {
  private readonly api = inject(ApiClient);

  list(): Observable<Court[]> {
    return this.api.get<Court[]>(API.v1.admin.courts);
  }

  get(id: number): Observable<Court> {
    return this.api.get<Court>(API.v1.admin.court(id));
  }

  create(body: CourtWrite): Observable<Court> {
    return this.api.post<Court>(API.v1.admin.courts, body);
  }

  replace(id: number, body: CourtWrite): Observable<Court> {
    return this.api.put<Court>(API.v1.admin.court(id), body);
  }

  update(id: number, body: Partial<CourtWrite>): Observable<Court> {
    return this.api.patch<Court>(API.v1.admin.court(id), body);
  }
}
