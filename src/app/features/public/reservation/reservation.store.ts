import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, timer } from 'rxjs';
import { ApiError } from '../../../core/api/api-error';
import { GuestBookingsApi } from '../../../core/api/guest-bookings.api';
import { PublicCourtsApi } from '../../../core/api/public-courts.api';
import { AvailabilitySlot, Booking, Court } from '../../../core/api/api.models';
import {
  addCalendarDays,
  estimateTotal,
  hoursFromMinutes,
  isColombianPhone,
  isDateInBookingWindow,
  sliceSlotRange,
  toBookingItem,
  todayYmd,
  durationMinutes,
} from './datetime';
import { isValidEmail } from '../../../core/auth/credentials';

export const PAYMENT_SIMULATION_MS = 1600;

export type ReservationStep = 1 | 2 | 3 | 4 | 5;
export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'down';

@Injectable()
export class ReservationStore {
  private readonly courtsApi = inject(PublicCourtsApi);
  private readonly bookingsApi = inject(GuestBookingsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly courts = signal<Court[]>([]);
  readonly courtsState = signal<LoadState>('idle');
  readonly courtId = signal<number | null>(null);

  readonly date = signal<string>('');
  readonly slots = signal<AvailabilitySlot[]>([]);
  readonly slotsState = signal<LoadState>('idle');
  readonly rangeStart = signal<number | null>(null);
  readonly rangeEnd = signal<number | null>(null);

  readonly guestName = signal('');
  readonly guestEmail = signal('');
  readonly guestPhone = signal('');

  readonly submitting = signal(false);
  readonly paying = signal(false);
  readonly error = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);

  readonly court = computed(() => this.courts().find((item) => item.id === this.courtId()) ?? null);

  readonly dateMin = computed(() => {
    const tz = this.court()?.timezone ?? 'America/Bogota';
    return todayYmd(tz);
  });

  readonly dateMax = computed(() => addCalendarDays(this.dateMin(), 30));

  readonly selectedRange = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (start === null || end === null) {
      return null;
    }
    return sliceSlotRange(this.slots(), start, end);
  });

  readonly selectedMinutes = computed(() => {
    const range = this.selectedRange();
    if (!range) {
      return 0;
    }
    return durationMinutes(range[0].start, range[range.length - 1].end);
  });

  readonly selectedHours = computed(() => hoursFromMinutes(this.selectedMinutes()));

  readonly estimatedTotal = computed(() => {
    const court = this.court();
    if (!court) {
      return 0;
    }
    return estimateTotal(court.price_per_hour, this.selectedMinutes());
  });

  readonly guestValid = computed(() => {
    const name = this.guestName().trim();
    return name.length >= 3 && isValidEmail(this.guestEmail()) && isColombianPhone(this.guestPhone());
  });

  readonly canSubmit = computed(
    () => Boolean(this.court() && this.selectedRange() && this.guestValid() && !this.submitting()),
  );

  readonly step = computed<ReservationStep>(() => {
    if (this.booking() || this.paying()) {
      return 5;
    }
    if (!this.court()) {
      return 1;
    }
    if (!this.date()) {
      return 2;
    }
    if (!this.selectedRange()) {
      return 3;
    }
    return 4;
  });

  loadCourts(): void {
    this.courtsState.set('loading');
    this.courtsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (courts) => {
        this.courts.set(courts);
        this.courtsState.set(courts.length ? 'ready' : 'empty');
      },
      error: () => this.courtsState.set('down'),
    });
  }

  selectCourt(id: number): void {
    if (this.courtId() === id) {
      return;
    }
    this.courtId.set(id);
    this.error.set(null);
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.slots.set([]);
    const date = this.date();
    const tz = this.court()?.timezone ?? 'America/Bogota';
    if (date && isDateInBookingWindow(date, tz)) {
      this.loadSlots();
    } else {
      this.date.set('');
      this.slotsState.set('idle');
    }
  }

  selectDate(ymd: string): void {
    const tz = this.court()?.timezone ?? 'America/Bogota';
    if (!isDateInBookingWindow(ymd, tz)) {
      this.error.set('Elige un día entre hoy y los próximos 30 días.');
      return;
    }
    this.date.set(ymd);
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.error.set(null);
    this.loadSlots();
  }

  pickSlot(index: number): void {
    const slot = this.slots()[index];
    if (!slot || slot.status !== 'free') {
      return;
    }

    const start = this.rangeStart();
    const end = this.rangeEnd();
    const completeAlone = sliceSlotRange(this.slots(), index, index);

    if (start !== null && end === null && index === start) {
      this.rangeStart.set(null);
      this.error.set(null);
      return;
    }

    if (start !== null && end !== null && start === end && index === start) {
      this.rangeStart.set(null);
      this.rangeEnd.set(null);
      this.error.set(null);
      return;
    }

    if (start !== null && end === null) {
      const range = sliceSlotRange(this.slots(), start, index);
      if (!range) {
        this.error.set('Elige un bloque continuo de al menos 1 hora, solo en horarios libres.');
        return;
      }
      this.rangeEnd.set(index);
      this.error.set(null);
      return;
    }

    if (start !== null && end !== null) {
      const extended = sliceSlotRange(this.slots(), start, index);
      if (extended) {
        this.rangeEnd.set(index);
        this.error.set(null);
        return;
      }
    }

    this.rangeStart.set(index);
    this.rangeEnd.set(completeAlone ? index : null);
    this.error.set(null);
  }

  submit(): void {
    const court = this.court();
    const range = this.selectedRange();
    if (!court || !range || !this.guestValid()) {
      return;
    }

    this.submitting.set(true);
    this.paying.set(true);
    this.error.set(null);

    forkJoin({
      booking: this.bookingsApi.create({
        guest_name: this.guestName().trim(),
        guest_email: this.guestEmail().trim(),
        guest_phone: this.guestPhone().trim(),
        simulate_payment: true,
        items: [toBookingItem(court.id, range)],
      }),
      wait: timer(PAYMENT_SIMULATION_MS),
    })
      .pipe(
        map(({ booking }) => booking),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (booking) => {
          this.submitting.set(false);
          this.paying.set(false);
          this.booking.set(booking);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.paying.set(false);
          if (error instanceof ApiError && error.isConflict) {
            this.error.set('Ese horario se acaba de ocupar. Elige otro.');
            this.rangeStart.set(null);
            this.rangeEnd.set(null);
            this.loadSlots();
            return;
          }
          if (error instanceof ApiError && error.isRateLimited) {
            this.error.set(error.message);
            return;
          }
          this.error.set(error instanceof ApiError ? error.message : 'No se pudo crear la reserva.');
        },
      });
  }

  startOver(): void {
    this.booking.set(null);
    this.paying.set(false);
    this.submitting.set(false);
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.error.set(null);
    if (this.date()) {
      this.loadSlots();
    }
  }

  private loadSlots(): void {
    const court = this.court();
    const date = this.date();
    if (!court || !date) {
      return;
    }

    this.slotsState.set('loading');
    this.courtsApi
      .courtAvailability(court.id, date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (availability) => {
        this.slots.set(availability.slots);
        this.slotsState.set(availability.slots.length ? 'ready' : 'empty');
      },
      error: (error: unknown) => {
        this.slots.set([]);
        this.slotsState.set('down');
        this.error.set(error instanceof ApiError ? error.message : 'No se pudo cargar el horario.');
      },
    });
  }
}
