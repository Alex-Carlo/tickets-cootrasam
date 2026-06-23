import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonList, IonItem, IonLabel, IonCard, IonCardContent, IonButton, IonIcon, IonChip, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, wifiOutline, closeCircle } from 'ionicons/icons';
import { ConsumedTicket } from '../../../core/models';
import { StorageService } from '../../../core/services/storage.service';
import { SyncService } from '../../../core/services/sync.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-consumed-list',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonSpinner,
    EmptyStateComponent,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="consumed-container">
        <!-- Status Bar -->
        <ion-card class="status-card">
          <ion-card-content>
            <div class="status-row">
              <div class="status-item">
                <ion-icon [name]="sync.isOnline() ? 'wifi-outline' : 'close-circle'"></ion-icon>
                <span>{{ sync.isOnline() ? 'En línea' : 'Sin conexión' }}</span>
              </div>
              <div class="status-item">
                <span>Pendientes: <strong>{{ pendingCount() }}</strong></span>
              </div>
              <div class="status-item" *ngIf="sync.lastSyncTime()">
                <small>Último sync: {{ sync.lastSyncTime() | date: 'short' }}</small>
              </div>
            </div>

            <ion-button
              expand="block"
              color="primary"
              (click)="syncNow()"
              [disabled]="!sync.isOnline() || sync.isSyncing()"
            >
              <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
              {{ sync.isSyncing() ? 'Sincronizando...' : 'Sincronizar Ahora' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && consumedTickets().length === 0">
          <app-empty-state
            icon="document-outline"
            title="Sin tiquetes consumidos"
            message="Aún no has consumido ningún tiquete"
          ></app-empty-state>
        </div>

        <!-- Consumed List -->
        <ion-card *ngIf="!isLoading() && consumedTickets().length > 0" class="list-card">
          <ion-card-content>
            <h3>Tiquetes Consumidos</h3>
            <ion-list>
              <ion-item *ngFor="let ticket of consumedTickets()" class="consumed-item">
                <ion-label>
                  <h3>{{ ticket.routeId }}</h3>
                  <p>ID: {{ ticket.ticketId }}</p>
                  <small>Consumido: {{ ticket.consumedAt | date: 'dd/MM/yyyy HH:mm' }}</small>
                </ion-label>
                <ion-chip
                  [color]="ticket.synced ? 'success' : 'warning'"
                  slot="end"
                >
                  {{ ticket.synced ? '✓ Sincronizado' : '⏳ Pendiente' }}
                </ion-chip>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <div *ngIf="isLoading()" class="loading">
          <ion-spinner color="primary"></ion-spinner>
          <p>Cargando...</p>
        </div>

        <div *ngIf="syncError()" class="error-message">
          {{ syncError() }}
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      --ion-background-color: var(--color-surface-alt);
    }

    .consumed-container {
      padding: var(--space-lg);
    }

    .status-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      margin-bottom: var(--space-lg);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .status-card ion-card-content {
      padding: var(--space-md);
    }

    .status-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--space-md);
      margin-bottom: var(--space-md);
    }

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      font-size: var(--font-size-sm);
    }

    .status-item ion-icon {
      font-size: 24px;
      margin-bottom: var(--space-xs);
    }

    .list-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    h3 {
      color: var(--color-on-surface);
      margin: 0 0 var(--space-md);
    }

    .consumed-item {
      border-bottom: 1px solid var(--color-border);
    }

    .consumed-item:last-child {
      border-bottom: none;
    }

    ion-label h3 {
      margin: var(--space-xs) 0;
      color: var(--color-on-surface);
    }

    ion-label p {
      color: var(--color-text-muted);
      font-family: monospace;
      margin: var(--space-xs) 0;
      word-break: break-all;
    }

    ion-label small {
      color: var(--color-text-muted);
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

    .error-message {
      color: var(--color-danger);
      padding: var(--space-md);
      background-color: rgba(231, 76, 60, 0.1);
      border-radius: var(--radius-sm);
      margin-top: var(--space-lg);
    }
  `]
})
export class ConsumedListPage implements OnInit {
  private storage = inject(StorageService);
  protected sync = inject(SyncService);

  consumedTickets = signal<ConsumedTicket[]>([]);
  isLoading = signal(false);
  syncError = signal<string | null>(null);

  get pendingCount(): any {
    return () => this.storage.getPendingTickets().length;
  }

  ngOnInit(): void {
    this.loadConsumedTickets();
  }

  loadConsumedTickets(): void {
    this.consumedTickets.set(this.storage.consumedTickets());
  }

  async syncNow(): Promise<void> {
    this.syncError.set(null);
    try {
      await this.sync.syncPending();
      this.loadConsumedTickets();
      alert('✓ Sincronización exitosa');
    } catch (err: any) {
      this.syncError.set(err.message || 'Error al sincronizar');
    }
  }

  constructor() {
    addIcons({ cloudUploadOutline, wifiOutline, closeCircle });
  }
}
