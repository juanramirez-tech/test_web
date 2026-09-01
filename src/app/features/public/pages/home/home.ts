import { Component, inject } from '@angular/core';
import { PageMeta } from '../../../../core/seo/page-meta';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  constructor() {
    inject(PageMeta).publicPage('Reservas de canchas');
  }
}
