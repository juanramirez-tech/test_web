import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PageMeta } from '../../core/seo/page-meta';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-shell.html',
})
export class PublicShell {
  constructor() {
    inject(PageMeta).publicPage('Reservas de canchas');
  }
}
