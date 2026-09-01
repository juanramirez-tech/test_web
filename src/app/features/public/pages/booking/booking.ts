import { Component, inject } from '@angular/core';
import { PageMeta } from '../../../../core/seo/page-meta';

@Component({
  selector: 'app-booking-page',
  templateUrl: './booking.html',
})
export class BookingPage {
  constructor() {
    inject(PageMeta).publicPage('Reservar');
  }
}
