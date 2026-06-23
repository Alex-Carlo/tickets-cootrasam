import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { Route, GenerateTicketRequest } from '../../../core/models';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonSpinner,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="payment-container">
        <ion-card class="summary-card">
          <ion-card-header>
            <ion-card-title>Resumen de la Compra</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div *ngIf="selectedRoute()">
              <div class="summary-row">
                <span>Ruta</span>
                <strong>{{ selectedRoute()?.origin }} → {{ selectedRoute()?.destination }}</strong>
              </div>
              <div class="summary-row">
                <span>Salida</span>
                <strong>{{ selectedRoute()?.departureTime }}</strong>
              </div>
              <div class="summary-row divider">
                <span>Precio</span>
                <strong class="price">$ {{ (selectedRoute()?.price || 0) | number }}</strong>
              </div>

              <p class="method-text">Método de pago: Wompi (Stub)</p>

              <ion-button
                expand="block"
                color="primary"
                size="large"
                (click)="confirmPayment()"
                [disabled]="isProcessing()"
              >
                <ion-spinner
                  name="crescent"
                  color="light"
                  *ngIf="isProcessing()"
                ></ion-spinner>
                {{ isProcessing() ? 'Procesando...' : 'Confirmar Pago' }}
              </ion-button>

              <ion-button expand="block" fill="outline" (click)="goBack()">
                Cancelar
              </ion-button>

              <div *ngIf="error()" class="error-message">
                {{ error() }}
              </div>
            </div>

            <div *ngIf="!selectedRoute()" class="loading">
              <ion-spinner></ion-spinner>
              <p>Cargando información...</p>
            </div>
          </ion-card-content>
        </ion-card>

        <div class="info-box">
          <p>
            <strong>ℹ️ Modo Demo:</strong> El pago es simulado. Se generará un tiquete automáticamente.
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-background-color: var(--color-surface-alt);
    }

    .payment-container {
      padding: var(--space-lg);
    }

    .summary-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--space-lg);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-md) 0;
      color: var(--color-on-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .summary-row.divider {
      border-bottom: 2px solid var(--color-primary);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
    }

    .price {
      color: var(--color-action);
    }

    .method-text {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-align: center;
      margin: var(--space-lg) 0 var(--space-lg);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-xxl);
    }

    .info-box {
      background-color: rgba(244, 208, 63, 0.1);
      border-left: 4px solid var(--color-warning);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
      margin-top: var(--space-lg);
    }

    .info-box p {
      margin: 0;
      color: var(--color-on-surface);
      font-size: var(--font-size-sm);
    }

    .error-message {
      color: var(--color-danger);
      padding: var(--space-md);
      background-color: rgba(231, 76, 60, 0.1);
      border-radius: var(--radius-sm);
      margin-top: var(--space-md);
      font-size: var(--font-size-sm);
    }
  `]
})
export class PaymentPage implements OnInit {
  private ticketApi = inject(TicketApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedRoute = signal<Route | null>(null);
  isProcessing = signal(false);
  error = signal<string | null>(null);
  private routeId: string = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.routeId = params['routeId'];
      // En v1, reconstruimos la ruta de la lista mock
      this.loadRoute();
    });
  }

  loadRoute(): void {
    this.ticketApi.getMockRoutes().subscribe({
      next: (routes) => {
        const found = routes.find(r => r.id === this.routeId);
        this.selectedRoute.set(found || null);
      },
      error: (err) => {
        console.error('Error loading route:', err);
        this.error.set('No se pudo cargar la información de la ruta');
      }
    });
  }

  async confirmPayment(): Promise<void> {
    if (!this.selectedRoute()) return;

    this.isProcessing.set(true);
    this.error.set(null);

    try {
      const user = this.auth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const request: GenerateTicketRequest = {
        passengerId: user.id,
        routeId: this.routeId
      };

      const ticket = await firstValueFrom(
        this.ticketApi.generateTicket(request)
      );

      // Save to localStorage for offline access
      const tickets = JSON.parse(localStorage.getItem('myTickets') || '[]');
      tickets.push(ticket);
      localStorage.setItem('myTickets', JSON.stringify(tickets));

      // Navigate to ticket display page
      this.router.navigate(['/passenger/ticket', ticket.id]);
    } catch (err: any) {
      console.error('Payment error:', err);
      this.error.set('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/passenger/routes']);
  }
}
