import { Component, inject } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { formatClock, formatCop, hoursFromMinutes } from '../../reservation/datetime';

@Component({
  selector: 'app-slot-grid',
  templateUrl: './slot-grid.html',
})
export class SlotGrid {
  protected readonly store = inject(ReservationStore);
  protected readonly clock = formatClock;
  protected readonly money = formatCop;
  protected readonly hours = hoursFromMinutes;

  protected isInRange(index: number): boolean {
    const start = this.store.rangeStart();
    const end = this.store.rangeEnd();
    if (start === null) {
      return false;
    }
    if (end === null) {
      return index === start;
    }
    return index >= Math.min(start, end) && index <= Math.max(start, end);
  }
}
