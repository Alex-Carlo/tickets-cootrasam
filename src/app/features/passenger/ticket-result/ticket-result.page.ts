import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { IonContent, IonCard, IonCardContent, IonButton, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { Ticket } from '../../../core/models';
import { TicketApiService } from '../../../core/services/ticket-api.service';
import { QrService } from '../../../core/services/qr.service';
import { QrDisplayComponent } from '../../../shared/components/qr-display/qr-display.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-ticket-result',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonIcon,
    QrDisplayComponent,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="ticket-result-container">
        <div *ngIf="isLoading()" class="loading">
          <ion-spinner color="primary" name="crescent"></ion-spinner>
          <p>Generando tu tiquete...</p>
        </div>

        <div *ngIf="!isLoading() && ticket()" class="ticket-display">
          <div class="success-banner">
            <ion-icon name="ticket-outline" class="success-icon"></ion-icon>
            <h2>¡Tiquete Generado!</h2>
            <p>Tu compra fue exitosa</p>
          </div>

          <ion-card class="ticket-info-card">
            <ion-card-content>
              <div class="info-section">
                <h3>Detalles del Tiquete</h3>
                <div class="detail-row">
                  <span>ID:</span>
                  <code>{{ ticket()!.id }}</code>
                </div>
                <div class="detail-row">
                  <span>Estado:</span>
                  <strong>{{ ticket()!.status }}</strong>
                </div>
                <div class="detail-row">
                  <span>Válido hasta:</span>
                  <strong>{{ ticket()!.expiresAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <app-qr-display
            *ngIf="qrDataUrl()"
            [dataUrl]="qrDataUrl()!"
            [ticketId]="ticket()!.id"
            (download)="downloadQR()"
            (share)="shareQR()"
          ></app-qr-display>

          <div class="actions">
            <ion-button expand="block" color="primary" (click)="goToMyTickets()">
              <ion-icon name="home-outline" slot="start"></ion-icon>
              Mis Tiquetes
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="backToRoutes()">
              Comprar otro
            </ion-button>
          </div>
        </div>

        <div *ngIf="!isLoading() && !ticket()" class="error">
          <p>Error al cargar el tiquete</p>
          <ion-button (click)="backToRoutes()">Volver</ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-background-color: var(--color-surface-alt);
    }

    .ticket-result-container {
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

    .success-banner {
      text-align: center;
      padding: var(--space-xl) var(--space-lg);
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      border-radius: var(--radius-md);
      color: white;
      margin-bottom: var(--space-lg);
    }

    .success-icon {
      font-size: 48px;
      display: block;
      margin-bottom: var(--space-md);
    }

    .success-banner h2 {
      margin: 0 0 var(--space-sm);
      color: white;
    }

    .success-banner p {
      margin: 0;
      opacity: 0.9;
    }

    .ticket-info-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--space-lg);
    }

    h3 {
      color: var(--color-on-surface);
      margin: 0 0 var(--space-md);
      font-size: var(--font-size-md);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-sm) 0;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-on-surface);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row span {
      color: var(--color-text-muted);
      font-weight: var(--font-weight-medium);
    }

    code {
      font-family: monospace;
      word-break: break-all;
      color: var(--color-primary);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      margin-top: var(--space-lg);
    }

    .error {
      text-align: center;
      padding: var(--space-xxl) var(--space-lg);
      color: var(--color-danger);
    }
  `]
})
export class TicketResultPage implements OnInit {
  private ticketApi = inject(TicketApiService);
  private qrService = inject(QrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ticket = signal<Ticket | null>(null);
  qrDataUrl = signal<string | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (params) => {
          const ticketId = params['ticketId'];

          // Get ticket from localStorage (includes token from generation)
          const tickets = JSON.parse(localStorage.getItem('myTickets') || '[]');
          const foundTicket = tickets.find((t: any) => t.id === ticketId);

          if (foundTicket && foundTicket.token) {
            this.ticket.set(foundTicket);
            await this.generateQR(foundTicket.token);
            this.isLoading.set(false);
          } else {
            // Fallback: GET ticket details if not in localStorage
            try {
              const ticket = await firstValueFrom(
                this.ticketApi.getTicketDetails(ticketId)
              );
              this.ticket.set(ticket);
              this.isLoading.set(false);
            } catch (err) {
              console.error('Error loading ticket:', err);
              this.isLoading.set(false);
            }
          }
        }
      });
  }

  private async generateQR(token: string): Promise<void> {
    try {
      const dataUrl = await this.qrService.generateQRDataUrl(token);
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  }

  downloadQR(): void {
    const qr = this.qrDataUrl();
    const ticketId = this.ticket()?.id;
    if (qr && ticketId) {
      this.qrService.downloadQR(qr, `ticket-${ticketId}.png`);
    }
  }

  async shareQR(): Promise<void> {
    const qr = this.qrDataUrl();
    const ticket = this.ticket();
    if (qr && ticket) {
      try {
        await this.qrService.shareQR(qr, `Tiquete ${ticket.id} válido hasta ${ticket.expiresAt}`);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  }

  goToMyTickets(): void {
    this.router.navigate(['/passenger/my-tickets']);
  }

  backToRoutes(): void {
    this.router.navigate(['/passenger/routes']);
  }
}
