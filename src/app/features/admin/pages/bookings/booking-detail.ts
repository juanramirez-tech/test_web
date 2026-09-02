import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminBookingsApi } from '../../../../core/api/admin-bookings.api';
import { Booking } from '../../../../core/api/api.models';
import { formatClock, formatCop } from '../../../public/reservation/datetime';
import {
  BOOKING_STATUS_LABEL,
  apiMessage,
  canCancelBooking,
  canConfirmBooking,
  formatAdminDate,
  formatAdminDateTime,
} from '../../admin-view';
import { DialogFocus } from '../../../../core/a11y/dialog-focus';
import { AdminIcon } from '../../ui/admin-icon';

@Component({
  selector: 'app-booking-detail-dialog',
  imports: [AdminIcon, DialogFocus],
  templateUrl: './booking-detail.html',
})
export class BookingDetailDialog {
  private readonly api = inject(AdminBookingsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly booking = input.required<Booking>();
  readonly saved = output<Booking>();
  readonly closed = output<void>();

  protected readonly money = formatCop;
  protected readonly clock = formatClock;
  protected readonly when = formatAdminDateTime;
  protected readonly day = formatAdminDate;
  protected readonly statusLabel = BOOKING_STATUS_LABEL;
  protected readonly acting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected canConfirm(): boolean {
    return canConfirmBooking(this.booking());
  }

  protected canCancel(): boolean {
    return canCancelBooking(this.booking());
  }

  protected close(): void {
    if (this.acting()) {
      return;
    }
    this.closed.emit();
  }

  confirm(): void {
    const booking = this.booking();
    if (!canConfirmBooking(booking) || this.acting()) {
      return;
    }
    this.acting.set(true);
    this.error.set(null);
    this.api
      .confirm(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.acting.set(false);
          this.saved.emit(updated);
        },
        error: (error: unknown) => {
          this.acting.set(false);
          this.error.set(apiMessage(error, 'No se pudo confirmar la reserva.'));
        },
      });
  }

  cancel(): void {
    const booking = this.booking();
    if (!canCancelBooking(booking) || this.acting()) {
      return;
    }
    this.acting.set(true);
    this.error.set(null);
    this.api
      .cancel(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.acting.set(false);
          this.saved.emit(updated);
        },
        error: (error: unknown) => {
          this.acting.set(false);
          this.error.set(apiMessage(error, 'No se pudo cancelar la reserva.'));
        },
      });
  }

  protected chipClass(): string {
    switch (this.booking().status) {
      case 'pending_payment':
        return 'bg-amber-100 text-amber-950';
      case 'paid':
        return 'bg-lime/60 text-pitch';
      case 'confirmed':
        return 'bg-turf/15 text-turf';
      case 'cancelled':
        return 'bg-sand text-muted';
      case 'expired':
        return 'bg-red-50 text-red-800';
      default:
        return 'bg-sand text-muted';
    }
  }
}
