import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMeta } from '../../../../core/seo/page-meta';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  constructor() {
    inject(PageMeta).privatePage('Admin · Panel');
  }
}
