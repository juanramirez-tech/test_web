import { Component, inject } from '@angular/core';
import { PageMeta } from '../../../../core/seo/page-meta';

@Component({
  selector: 'app-my-booking',
  templateUrl: './my-booking.html',
})
export class MyBookingPage {
  constructor() {
    inject(PageMeta).publicPage('Mi reserva');
  }
}
