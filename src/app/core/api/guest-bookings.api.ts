import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api.client';
import { API } from './api.endpoints';
import { Booking, BookingCreate } from './api.models';

@Injectable({ providedIn: 'root' })
export class GuestBookingsApi {
  private readonly api = inject(ApiClient);

  create(body: BookingCreate): Observable<Booking> {
    return this.api.post<Booking>(API.v1.bookings, body, { skipAuth: true });
  }

  mine(): Observable<Booking> {
    return this.api.get<Booking>(API.v1.myBooking, { skipAuth: true, useGuestAccess: true });
  }

  pay(): Observable<Booking> {
    return this.api.post<Booking>(API.v1.payBooking, {}, { skipAuth: true, useGuestAccess: true });
  }

  cancel(): Observable<Booking> {
    return this.api.post<Booking>(API.v1.cancelBooking, {}, { skipAuth: true, useGuestAccess: true });
  }
}
