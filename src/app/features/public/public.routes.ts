import { Routes } from '@angular/router';
import { PublicShell } from './public-shell';

export const publicRoutes: Routes = [
  {
    path: '',
    component: PublicShell,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'reservar',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
