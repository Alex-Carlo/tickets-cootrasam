import { Routes } from '@angular/router';

export const PASSENGER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'routes',
    pathMatch: 'full'
  },
  {
    path: 'routes',
    loadComponent: () => import('./route-selection/route-selection.page').then(m => m.RouteSelectionPage)
  },
  {
    path: 'payment/:routeId',
    loadComponent: () => import('./payment/payment.page').then(m => m.PaymentPage)
  },
  {
    path: 'ticket/:ticketId',
    loadComponent: () => import('./ticket-result/ticket-result.page').then(m => m.TicketResultPage)
  },
  {
    path: 'my-tickets',
    loadComponent: () => import('./my-tickets/my-tickets.page').then(m => m.MyTicketsPage)
  }
];
