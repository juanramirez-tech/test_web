import { Component, effect, inject } from '@angular/core';
import { PageMeta } from '../../../../core/seo/page-meta';
import { ReservationStore } from '../../reservation/reservation.store';
import { formatClock, formatCop } from '../../reservation/datetime';
import { BookingSuccess } from './booking-success';
import { CourtPicker } from './court-picker';
import { DateCalendar } from './date-calendar';
import { GuestForm } from './guest-form';
import { SlotGrid } from './slot-grid';

@Component({
  selector: 'app-home',
  imports: [CourtPicker, DateCalendar, SlotGrid, GuestForm, BookingSuccess],
  providers: [ReservationStore],
  templateUrl: './home.html',
})
export class Home {
  protected readonly store = inject(ReservationStore);
  protected readonly money = formatCop;
  protected readonly clock = formatClock;

  protected readonly steps = [
    { n: 1 as const, label: 'Cancha' },
    { n: 2 as const, label: 'Día' },
    { n: 3 as const, label: 'Horario' },
    { n: 4 as const, label: 'Datos' },
    { n: 5 as const, label: 'Pago' },
  ];

  constructor() {
    inject(PageMeta).publicPage('Reserva de canchas');
    this.store.loadCourts();

    effect(() => {
      const step = this.store.step();
      if (step === 1) {
        return;
      }
      const ids: Record<number, string> = {
        2: 'paso-cuando',
        3: 'paso-cuando',
        4: 'paso-cuando',
        5: 'paso-listo',
      };
      const id = ids[step];
      queueMicrotask(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    });
  }
}
