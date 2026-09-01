import { Component, inject } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.html',
})
export class GuestForm {
  protected readonly store = inject(ReservationStore);

  protected setName(event: Event): void {
    this.store.guestName.set((event.target as HTMLInputElement).value);
  }

  protected setEmail(event: Event): void {
    this.store.guestEmail.set((event.target as HTMLInputElement).value);
  }

  protected setPhone(event: Event): void {
    this.store.guestPhone.set((event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 10));
  }
}
