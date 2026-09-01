import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PageMeta } from '../../core/seo/page-meta';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  private readonly auth = inject(AuthService);

  protected readonly email = this.auth.email;

  constructor() {
    inject(PageMeta).privatePage('Admin · Reservas de canchas');
  }

  protected logout(): void {
    this.auth.logout();
  }
}
