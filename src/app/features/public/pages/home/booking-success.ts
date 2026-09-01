import { Component, inject } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { formatClock, formatCop } from '../../reservation/datetime';

@Component({
  selector: 'app-booking-success',
  templateUrl: './booking-success.html',
})
export class BookingSuccess {
  protected readonly store = inject(ReservationStore);
  protected readonly clock = formatClock;
  protected readonly money = formatCop;
}
