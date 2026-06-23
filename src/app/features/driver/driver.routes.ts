import { Routes } from '@angular/router';

export const DRIVER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'scanner',
    pathMatch: 'full'
  },
  {
    path: 'scanner',
    loadComponent: () => import('./scanner/scanner.page').then(m => m.ScannerPage)
  },
  {
    path: 'consumed',
    loadComponent: () => import('./consumed-list/consumed-list.page').then(m => m.ConsumedListPage)
  }
];
