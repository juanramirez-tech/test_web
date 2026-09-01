import { Component, inject } from '@angular/core';
import { ReservationStore } from '../../reservation/reservation.store';
import { formatCop } from '../../reservation/datetime';

@Component({
  selector: 'app-court-picker',
  templateUrl: './court-picker.html',
})
export class CourtPicker {
  protected readonly store = inject(ReservationStore);
  protected readonly money = formatCop;
}
