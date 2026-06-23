import { Routes } from '@angular/router';
import { authGuard, passengerGuard, driverGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'passenger',
    canActivate: [passengerGuard],
    loadChildren: () => import('./features/passenger/passenger.routes').then(m => m.PASSENGER_ROUTES),
  },
  {
    path: 'driver',
    canActivate: [driverGuard],
    loadChildren: () => import('./features/driver/driver.routes').then(m => m.DRIVER_ROUTES),
  },
];
