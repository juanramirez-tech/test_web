import { Routes } from '@angular/router';
import { AdminShell } from './admin-shell';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'courts',
        loadComponent: () =>
          import('./pages/courts/court-list').then((m) => m.CourtList),
      },
      { path: 'courts/new', redirectTo: 'courts', pathMatch: 'full' },
      { path: 'courts/:id', redirectTo: 'courts' },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/bookings/booking-list').then((m) => m.BookingList),
      },
      {
        path: 'bookings/:id',
        redirectTo: ({ params }) => `/admin/bookings?reserva=${params['id']}`,
      },
    ],
  },
];
