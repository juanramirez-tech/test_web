import { Component, inject } from '@angular/core';
import { PageMeta } from '../../../../core/seo/page-meta';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  constructor() {
    inject(PageMeta).privatePage('Admin');
  }
}
