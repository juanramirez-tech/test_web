import { Component, inject, signal } from '@angular/core';
import { isValidEmail } from '../../../../core/auth/credentials';
import { isColombianPhone } from '../../reservation/datetime';
import { ReservationStore } from '../../reservation/reservation.store';

@Component({
  selector: 'app-guest-form',
  templateUrl: './guest-form.html',
})
export class GuestForm {
  protected readonly store = inject(ReservationStore);
  protected readonly nameTouched = signal(false);
  protected readonly emailTouched = signal(false);
  protected readonly phoneTouched = signal(false);

  protected setName(event: Event): void {
    this.store.guestName.set((event.target as HTMLInputElement).value);
  }

  protected setEmail(event: Event): void {
    this.store.guestEmail.set((event.target as HTMLInputElement).value);
  }

  protected setPhone(event: Event): void {
    this.store.guestPhone.set((event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 10));
  }

  protected nameError(): string | null {
    if (!this.nameTouched()) {
      return null;
    }
    const name = this.store.guestName().trim();
    if (name.length < 3) {
      return 'El nombre debe tener al menos 3 caracteres.';
    }
    return null;
  }

  protected emailError(): string | null {
    if (!this.emailTouched()) {
      return null;
    }
    if (!isValidEmail(this.store.guestEmail())) {
      return 'Ingresa un correo válido.';
    }
    return null;
  }

  protected phoneError(): string | null {
    if (!this.phoneTouched()) {
      return null;
    }
    if (!isColombianPhone(this.store.guestPhone())) {
      return 'El celular debe ser un número colombiano de 10 dígitos (3…).';
    }
    return null;
  }
}
