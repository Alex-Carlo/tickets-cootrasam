import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { Ticket } from '../../../core/models';
import { TicketCardComponent } from '../../../shared/components/ticket-card/ticket-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    IonButton,
    TicketCardComponent,
    EmptyStateComponent,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="tickets-container">
        <div *ngIf="isLoading()" class="loading">
          <ion-spinner color="primary"></ion-spinner>
          <p>Cargando tus tiquetes...</p>
        </div>

        <div *ngIf="!isLoading() && tickets().length === 0">
          <app-empty-state
            icon="document-outline"
            title="Sin tiquetes"
            message="No tienes tiquetes comprados. ¡Compra uno ahora!"
          ></app-empty-state>
          <div class="action-buttons">
            <ion-button expand="block" color="primary" (click)="goToRoutes()">
              Comprar Tiquete
            </ion-button>
          </div>
        </div>

        <div *ngIf="!isLoading() && tickets().length > 0" class="tickets-list">
          <app-ticket-card
            *ngFor="let ticket of tickets()"
            [ticket]="ticket"
            (view)="viewTicket($event)"
          ></app-ticket-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-background-color: var(--color-surface-alt);
    }

    .tickets-container {
      padding: var(--space-lg);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-xxl);
      text-align: center;
    }

    .loading p {
      color: var(--color-text-muted);
      margin-top: var(--space-md);
    }

    .tickets-list {
      display: flex;
      flex-direction: column;
    }

    .action-buttons {
      padding: var(--space-lg) 0;
    }
  `]
})
export class MyTicketsPage implements OnInit {
  private router = inject(Router);

  tickets = signal<Ticket[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    try {
      const stored = localStorage.getItem('myTickets');
      const ticketsList = stored ? JSON.parse(stored) : [];

      // Filter only active and not expired
      const now = new Date();
      const active = ticketsList.filter((t: Ticket) => {
        const expiry = new Date(t.expiresAt);
        return expiry > now;
      });

      this.tickets.set(active);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  viewTicket(ticketId: string): void {
    this.router.navigate(['/passenger/ticket', ticketId]);
  }

  goToRoutes(): void {
    this.router.navigate(['/passenger/routes']);
  }
}
