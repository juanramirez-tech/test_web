import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API } from './api.endpoints';
import { Court, CourtAvailability, MultiAvailability } from './api.models';

@Injectable({ providedIn: 'root' })
export class PublicCourtsApi {
  private readonly api = inject(ApiClient);

  list(): Observable<Court[]> {
    return this.api.get<Court[]>(API.v1.courts, { skipAuth: true });
  }

  get(id: number): Observable<Court> {
    return this.api.get<Court>(API.v1.court(id), { skipAuth: true });
  }

  availability(date: string, courtIds?: readonly number[]): Observable<MultiAvailability> {
    return this.api.get<MultiAvailability>(API.v1.courtsAvailability, {
      skipAuth: true,
      params: {
        date,
        court_ids: courtIds?.length ? courtIds.join(',') : undefined,
      },
    });
  }

  courtAvailability(id: number, date: string): Observable<CourtAvailability> {
    return this.api.get<CourtAvailability>(API.v1.courtAvailability(id), {
      skipAuth: true,
      params: { date },
    });
  }
}
