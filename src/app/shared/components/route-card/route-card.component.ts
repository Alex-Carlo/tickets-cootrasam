import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Route } from '../../../core/models';
import { arrowForwardOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-route-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon],
  template: `
    <ion-card class="route-card" (click)="onSelect()">
      <ion-card-header>
        <ion-card-title class="route-title">
          {{ route.origin }} <ion-icon name="arrow-forward-outline"></ion-icon> {{ route.destination }}
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="route-details">
          <div class="detail">
            <small>Salida</small>
            <p>{{ route.departureTime || 'Por confirmar' }}</p>
          </div>
          <div class="detail">
            <small>Precio</small>
            <p class="price">$ {{ route.price | number }}</p>
          </div>
        </div>
        <ion-button expand="block" color="primary">Seleccionar ruta</ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: var(--space-md);
    }

    .route-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .route-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .route-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: var(--font-size-md);
      color: var(--color-on-surface);
    }

    ion-icon {
      font-size: 20px;
      color: var(--color-accent);
    }

    .route-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
      margin: var(--space-md) 0;
      padding: var(--space-md) 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .detail {
      display: flex;
      flex-direction: column;
    }

    .detail small {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      font-weight: var(--font-weight-bold);
    }

    .detail p {
      margin: var(--space-xs) 0 0;
      color: var(--color-on-surface);
      font-weight: var(--font-weight-medium);
    }

    .price {
      color: var(--color-action);
      font-size: var(--font-size-lg);
    }
  `]
})
export class RouteCardComponent {
  @Input() route!: Route;
  @Output() select = new EventEmitter<Route>();

  onSelect(): void {
    this.select.emit(this.route);
  }

  constructor() {
    addIcons({ arrowForwardOutline });
  }
}
