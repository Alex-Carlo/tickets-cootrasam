import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized.page').then(m => m.UnauthorizedPage)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
