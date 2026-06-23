import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton } from '@ionic/angular/standalone';
import { Ticket } from '../../../core/models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, StatusBadgeComponent],
  template: `
    <ion-card class="ticket-card">
      <ion-card-header>
        <div class="ticket-header">
          <ion-card-title>{{ ticket.routeId }}</ion-card-title>
          <app-status-badge [status]="ticket.status"></app-status-badge>
        </div>
      </ion-card-header>
      <ion-card-content>
        <div class="ticket-info">
          <div class="info-row">
            <small>ID del Tiquete</small>
            <p>{{ ticket.id }}</p>
          </div>
          <div class="info-row">
            <small>Válido hasta</small>
            <p>{{ ticket.expiresAt | date: 'dd/MM/yyyy HH:mm' }}</p>
          </div>
          <div class="info-row">
            <small>Comprado</small>
            <p>{{ ticket.createdAt | date: 'dd/MM/yyyy HH:mm' }}</p>
          </div>
        </div>
        <ion-button expand="block" color="primary" (click)="onView()">
          Ver QR
        </ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: var(--space-md);
    }

    .ticket-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-md);
    }

    ion-card-title {
      color: var(--color-on-surface);
      font-size: var(--font-size-md);
    }

    .ticket-info {
      margin: var(--space-md) 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .info-row {
      display: flex;
      flex-direction: column;
    }

    .info-row small {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      font-weight: var(--font-weight-bold);
    }

    .info-row p {
      margin: var(--space-xs) 0 0;
      color: var(--color-on-surface);
      font-family: monospace;
      word-break: break-all;
    }
  `]
})
export class TicketCardComponent {
  @Input() ticket!: Ticket;
  @Output() view = new EventEmitter<string>();

  onView(): void {
    this.view.emit(this.ticket.id);
  }
}
