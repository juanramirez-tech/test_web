import { Component, computed, effect, inject, signal } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import {
  WEEKDAY_LABELS,
  formatFriendlyDate,
  formatMonthTitle,
  isDateYmd,
  monthCells,
  monthOverlapsWindow,
  parseYmd,
  shiftMonth,
  todayYmd,
} from '../../reservation/datetime';

@Component({
  selector: 'app-date-calendar',
  templateUrl: './date-calendar.html',
})
export class DateCalendar {
  protected readonly store = inject(ReservationStore);
  protected readonly weekdays = WEEKDAY_LABELS;
  protected readonly viewYear = signal(0);
  protected readonly viewMonth = signal(0);

  protected readonly title = computed(() => formatMonthTitle(this.viewYear(), this.viewMonth()));
  protected readonly today = computed(() => todayYmd(this.store.court()?.timezone ?? 'America/Bogota'));
  protected readonly cells = computed(() =>
    monthCells(this.viewYear(), this.viewMonth(), this.store.dateMin(), this.store.dateMax()),
  );
  protected readonly canPrev = computed(() => {
    const prev = shiftMonth(this.viewYear(), this.viewMonth(), -1);
    return monthOverlapsWindow(prev.year, prev.month, this.store.dateMin(), this.store.dateMax());
  });
  protected readonly canNext = computed(() => {
    const next = shiftMonth(this.viewYear(), this.viewMonth(), 1);
    return monthOverlapsWindow(next.year, next.month, this.store.dateMin(), this.store.dateMax());
  });
  protected readonly selectedLabel = computed(() => {
    const date = this.store.date();
    return isDateYmd(date) ? formatFriendlyDate(date) : null;
  });

  constructor() {
    const initial = this.store.dateMin();
    if (isDateYmd(initial)) {
      const { year, month } = parseYmd(initial);
      this.viewYear.set(year);
      this.viewMonth.set(month);
    }

    effect(() => {
      const selected = this.store.date();
      if (!isDateYmd(selected)) {
        return;
      }
      const { year, month } = parseYmd(selected);
      this.viewYear.set(year);
      this.viewMonth.set(month);
    });
  }

  protected shift(delta: number): void {
    if ((delta < 0 && !this.canPrev()) || (delta > 0 && !this.canNext())) {
      return;
    }
    const next = shiftMonth(this.viewYear(), this.viewMonth(), delta);
    this.viewYear.set(next.year);
    this.viewMonth.set(next.month);
  }

  protected pick(ymd: string, selectable: boolean): void {
    if (!selectable || !this.store.court()) {
      return;
    }
    this.store.selectDate(ymd);
  }
}
