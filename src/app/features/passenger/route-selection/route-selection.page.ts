import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Route } from '../../../core/models';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { RouteCardComponent } from '../../../shared/components/route-card/route-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-route-selection',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    RouteCardComponent,
    EmptyStateComponent,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="routes-container">
        <div *ngIf="isLoading()" class="loading">
          <ion-spinner color="primary"></ion-spinner>
          <p>Cargando rutas...</p>
        </div>

        <div *ngIf="!isLoading() && routes().length === 0">
          <app-empty-state
            icon="document-outline"
            title="Sin rutas disponibles"
            message="No hay rutas disponibles en este momento"
          ></app-empty-state>
        </div>

        <div *ngIf="!isLoading() && routes().length > 0" class="routes-list">
          <app-route-card
            *ngFor="let route of routes()"
            [route]="route"
            (select)="selectRoute($event)"
          ></app-route-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-background-color: var(--color-surface-alt);
    }

    ion-header {
      --background: var(--color-primary);
      --color: var(--color-on-primary);
    }

    .routes-container {
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

    .routes-list {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class RouteSelectionPage implements OnInit {
  private ticketApi = inject(TicketApiService);
  private router = inject(Router);

  routes = signal<Route[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.ticketApi.getMockRoutes().subscribe({
      next: (routes) => {
        this.routes.set(routes);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading routes:', err);
        this.isLoading.set(false);
      }
    });
  }

  selectRoute(route: Route): void {
    this.router.navigate(['/passenger/payment', route.id]);
  }
}
