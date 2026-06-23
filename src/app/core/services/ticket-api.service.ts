import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Ticket,
  Route,
  GenerateTicketRequest,
  SyncRequest,
  SyncResult,
  API_URL_TOKEN
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class TicketApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL_TOKEN);

  private readonly baseUrl = () => `${this.apiUrl}/tickets`;

  downloadPublicKey(): Observable<{ publicKey: string }> {
    return this.http.get<{ publicKey: string }>(`${this.baseUrl()}/public-key`);
  }

  generateTicket(req: GenerateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl()}/generate`, req);
  }

  getTicketDetails(ticketId: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl()}/${ticketId}`);
  }

  getPassengerTickets(passengerId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl()}/passenger/${passengerId}`);
  }

  getRouteTickets(routeId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl()}/route/${routeId}`);
  }

  syncConsumedTickets(req: SyncRequest): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.baseUrl()}/sync`, req);
  }

  // Helper to get mock routes for v1
  getMockRoutes(): Observable<Route[]> {
    return new Observable(observer => {
      observer.next([
        {
          id: 'route-001',
          name: 'Medellín → Bogotá',
          origin: 'Medellín',
          destination: 'Bogotá',
          departureTime: '08:00',
          price: 85000
        },
        {
          id: 'route-002',
          name: 'Bogotá → Cali',
          origin: 'Bogotá',
          destination: 'Cali',
          departureTime: '10:30',
          price: 95000
        },
        {
          id: 'route-003',
          name: 'Cali → Medellín',
          origin: 'Cali',
          destination: 'Medellín',
          departureTime: '14:00',
          price: 100000
        }
      ]);
      observer.complete();
    });
  }
}
