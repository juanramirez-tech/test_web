import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient, QueryParams } from './api.client';
import { API } from './api.endpoints';
import { AdminBookingQuery, Booking, BookingList } from './api.models';

@Injectable({ providedIn: 'root' })
export class AdminBookingsApi {
  private readonly api = inject(ApiClient);

  list(query?: AdminBookingQuery): Observable<BookingList> {
    return this.api.get<BookingList>(API.v1.admin.bookings, {
      params: { ...query } as QueryParams,
    });
  }

  get(id: number): Observable<Booking> {
    return this.api.get<Booking>(API.v1.admin.booking(id));
  }

  confirm(id: number): Observable<Booking> {
    return this.api.post<Booking>(API.v1.admin.confirmBooking(id));
  }

  cancel(id: number): Observable<Booking> {
    return this.api.post<Booking>(API.v1.admin.cancelBooking(id));
  }
}
