import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, checkmarkCircle, closeCircle, cameraOutline, imageOutline } from 'ionicons/icons';
import { ValidationResult } from '../../../core/models';
import { JwtValidationService } from '../../../core/services/jwt-validation.service';
import { StorageService } from '../../../core/services/storage.service';
import { SyncService } from '../../../core/services/sync.service';
import { CameraService } from '../../../core/services/camera.service';
import { QrScannerService } from '../../../core/services/qr-scanner.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <ion-content>
      <div class="scanner-container">
        <ion-card class="scanner-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="qr-code-outline" class="qr-icon"></ion-icon>
              Escanea o pega un JWT
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Camera Buttons -->
            <div class="camera-buttons">
              <ion-button
                expand="block"
                color="primary"
                (click)="openCamera()"
                [disabled]="isScanning()"
              >
                <ion-icon name="camera-outline" slot="start"></ion-icon>
                {{ isScanning() ? 'Escaneando...' : 'Abrir Cámara' }}
              </ion-button>
              <ion-button
                expand="block"
                fill="outline"
                (click)="openGallery()"
                [disabled]="isScanning()"
              >
                <ion-icon name="image-outline" slot="start"></ion-icon>
                Elegir Foto
              </ion-button>
            </div>

            <!-- Manual Input -->
            <div class="divider">
              <p>O pega el JWT manualmente</p>
            </div>

            <div class="input-group">
              <label>Token JWT del Tiquete</label>
              <ion-input
                [(ngModel)]="tokenInput"
                type="text"
                placeholder="Pega aquí el código QR o JWT..."
                (keyup.enter)="validateToken()"
              ></ion-input>
            </div>

            <ion-button
              expand="block"
              fill="outline"
              size="small"
              (click)="loadExampleToken()"
              class="example-btn"
            >
              📋 Usar Token de Ejemplo
            </ion-button>

            <ion-button
              expand="block"
              color="primary"
              size="large"
              (click)="validateToken()"
              [disabled]="!tokenInput || isValidating()"
            >
              <ion-spinner
                name="crescent"
                *ngIf="isValidating()"
              ></ion-spinner>
              {{ isValidating() ? 'Validando...' : 'Validar Tiquete' }}
            </ion-button>

            <div *ngIf="validationResult()" class="validation-result">
              <div [ngClass]="validationResult()!.valid ? 'success' : 'error'">
                <ion-icon [name]="validationResult()!.valid ? 'checkmark-circle' : 'close-circle'"></ion-icon>
                <h3>{{ validationResult()!.valid ? '✓ Tiquete Válido' : '✗ Tiquete Inválido' }}</h3>
                <p>{{ validationResult()!.error || 'El tiquete es válido' }}</p>

                <div *ngIf="validationResult()!.payload" class="payload-info">
                  <div class="info-row">
                    <span>ID Pasajero:</span>
                    <code>{{ validationResult()!.payload!.passengerId }}</code>
                  </div>
                  <div class="info-row">
                    <span>Ruta:</span>
                    <code>{{ validationResult()!.payload!.routeId }}</code>
                  </div>
                  <div class="info-row">
                    <span>Válido hasta:</span>
                    <strong>{{ validationResult()!.payload!.expiresAt | date: 'dd/MM/yyyy HH:mm' }}</strong>
                  </div>
                </div>

                <ion-button
                  *ngIf="validationResult()!.valid && !isAlreadyConsumed()"
                  expand="block"
                  color="success"
                  (click)="markAsConsumed()"
                  [disabled]="isMarking()"
                >
                  <ion-spinner
                    name="crescent"
                    *ngIf="isMarking()"
                  ></ion-spinner>
                  {{ isMarking() ? 'Procesando...' : '✓ Marcar como Consumido' }}
                </ion-button>

                <div *ngIf="isAlreadyConsumed()" class="already-consumed">
                  <ion-icon name="checkmark-circle"></ion-icon>
                  <p>Este tiquete ya fue consumido</p>
                </div>

                <div *ngIf="syncMessage()" [ngClass]="'sync-message ' + syncMessage()!.type">
                  <p>{{ syncMessage()!.text }}</p>
                </div>

                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="resetValidation()"
                >
                  Validar Otro
                </ion-button>
              </div>
            </div>

            <div class="instructions">
              <h4>📌 Instrucciones:</h4>
              <ol>
                <li>Escanea el código QR del pasajero (en versión real usaría cámara)</li>
                <li>O pega el JWT manualmente aquí</li>
                <li>Haz click en "Validar Tiquete"</li>
                <li>Si es válido, marca como consumido</li>
              </ol>
            </div>
          </ion-card-content>
        </ion-card>
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

    .scanner-container {
      padding: var(--space-lg);
    }

    .scanner-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    .qr-icon {
      font-size: 28px;
      margin-right: var(--space-sm);
      color: var(--color-accent);
    }

    .camera-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .divider {
      text-align: center;
      margin: var(--space-lg) 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background-color: var(--color-border);
    }

    .divider p {
      position: relative;
      background-color: var(--color-surface);
      display: inline-block;
      padding: 0 var(--space-md);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    ion-card-title {
      display: flex;
      align-items: center;
      color: var(--color-on-surface);
    }

    .input-group {
      margin-bottom: var(--space-md);
      display: flex;
      flex-direction: column;
    }

    .example-btn {
      margin-bottom: var(--space-lg);
      font-size: var(--font-size-sm);
    }

    label {
      color: var(--color-on-surface);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    ion-input {
      --padding-start: var(--space-md);
      --padding-end: var(--space-md);
      --padding-top: var(--space-md);
      --padding-bottom: var(--space-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }

    .validation-result {
      margin-top: var(--space-lg);
      padding: var(--space-lg);
      border-radius: var(--radius-md);
    }

    .success {
      background-color: rgba(46, 204, 113, 0.1);
      border-left: 4px solid var(--color-success);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
    }

    .error {
      background-color: rgba(231, 76, 60, 0.1);
      border-left: 4px solid var(--color-danger);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
    }

    .validation-result ion-icon {
      font-size: 48px;
      display: block;
      margin-bottom: var(--space-md);
    }

    .success ion-icon {
      color: var(--color-success);
    }

    .error ion-icon {
      color: var(--color-danger);
    }

    h3 {
      margin: var(--space-sm) 0;
      color: var(--color-on-surface);
    }

    .payload-info {
      margin: var(--space-lg) 0;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-sm) 0;
      color: var(--color-on-surface);
      font-size: var(--font-size-sm);
    }

    code {
      font-family: monospace;
      color: var(--color-primary);
    }

    .instructions {
      margin-top: var(--space-lg);
      padding: var(--space-md);
      background-color: rgba(52, 152, 219, 0.1);
      border-left: 4px solid var(--color-accent);
      border-radius: var(--radius-sm);
    }

    .instructions h4 {
      margin: 0 0 var(--space-md);
      color: var(--color-on-surface);
    }

    .instructions ol {
      margin: 0;
      padding-left: var(--space-lg);
      color: var(--color-on-surface);
      font-size: var(--font-size-sm);
    }

    .instructions li {
      margin-bottom: var(--space-sm);
    }

    .already-consumed {
      background-color: rgba(241, 196, 15, 0.1);
      border-left: 4px solid var(--color-warning);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
      text-align: center;
      margin-top: var(--space-lg);
    }

    .already-consumed ion-icon {
      font-size: 32px;
      color: var(--color-warning);
      display: block;
      margin-bottom: var(--space-sm);
    }

    .already-consumed p {
      margin: 0;
      color: var(--color-on-surface);
    }

    .sync-message {
      padding: var(--space-md);
      border-radius: var(--radius-sm);
      margin-top: var(--space-md);
      text-align: center;
      font-size: var(--font-size-sm);
    }

    .sync-message.success {
      background-color: rgba(46, 204, 113, 0.1);
      border-left: 4px solid var(--color-success);
      color: var(--color-success);
    }

    .sync-message.error {
      background-color: rgba(231, 76, 60, 0.1);
      border-left: 4px solid var(--color-danger);
      color: var(--color-danger);
    }

    .sync-message.warning {
      background-color: rgba(241, 196, 15, 0.1);
      border-left: 4px solid var(--color-warning);
      color: var(--color-warning);
    }

    .sync-message p {
      margin: 0;
    }
  `]
})
export class ScannerPage {
  private jwtValidator = inject(JwtValidationService);
  private storage = inject(StorageService);
  private sync = inject(SyncService);
  private camera = inject(CameraService);
  private qrScanner = inject(QrScannerService);

  tokenInput = '';
  isValidating = signal(false);
  isScanning = signal(false);
  isMarking = signal(false);
  syncMessage = signal<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  validationResult = signal<ValidationResult | null>(null);

  async openCamera(): Promise<void> {
    this.isScanning.set(true);
    try {
      const photo = await this.camera.takePhoto();
      if (photo) {
        await this.processImage(photo);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Error al acceder a la cámara');
    } finally {
      this.isScanning.set(false);
    }
  }

  async openGallery(): Promise<void> {
    this.isScanning.set(true);
    try {
      const photo = await this.camera.pickPhotoFromGallery();
      if (photo) {
        await this.processImage(photo);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      alert('Error al acceder a la galería');
    } finally {
      this.isScanning.set(false);
    }
  }

  private async processImage(imageData: string): Promise<void> {
    try {
      this.isScanning.set(true);
      const qrData = await this.qrScanner.scanQRFromImage(imageData);

      if (qrData) {
        this.tokenInput = qrData;
        // Auto-validate after scanning
        setTimeout(() => this.validateToken(), 300);
      } else {
        // Fallback: show message and let user paste manually
        console.warn('No QR code found in image');
        alert('No se encontró un código QR en la imagen. Por favor, pega el JWT manualmente o intenta con otra foto.');
        this.tokenInput = ''; // Clear the undefined value
      }
    } catch (error) {
      console.error('QR scan error:', error);
      alert('Error al procesar la imagen. Asegúrate de seleccionar una imagen válida.');
      this.tokenInput = '';
    } finally {
      this.isScanning.set(false);
    }
  }

  validateToken(): void {
    if (!this.tokenInput.trim()) return;

    this.isValidating.set(true);
    setTimeout(() => {
      const result = this.jwtValidator.validate(this.tokenInput);
      this.validationResult.set(result);
      this.isValidating.set(false);
    }, 500);
  }

  async markAsConsumed(): Promise<void> {
    const result = this.validationResult();
    if (!result || !result.valid || !result.payload) return;

    // Check if already consumed locally
    if (this.isAlreadyConsumed()) {
      this.syncMessage.set({
        type: 'warning',
        text: 'Este tiquete ya fue consumido previamente'
      });
      return;
    }

    this.isMarking.set(true);
    this.syncMessage.set(null);

    try {
      // Save locally as consumed
      this.storage.saveConsumedTicket({
        ticketId: result.payload.ticketId,
        routeId: result.payload.routeId,
        consumedAt: new Date().toISOString(),
        synced: false
      });

      // Attempt immediate sync if online
      if (this.sync.isOnline()) {
        try {
          const syncResult = await this.sync.syncPending();

          // Check sync result details
          const detail = syncResult.details.find(d => d.ticketId === result.payload!.ticketId);

          if (syncResult.synced > 0 && detail?.result === 'synced') {
            this.syncMessage.set({
              type: 'success',
              text: '✓ Tiquete sincronizado exitosamente'
            });
          } else if (detail?.result === 'skipped') {
            this.syncMessage.set({
              type: 'warning',
              text: `⚠ ${detail.reason || 'Tiquete ya fue consumido'}`
            });
          } else if (syncResult.failed > 0) {
            this.syncMessage.set({
              type: 'error',
              text: 'Error al sincronizar. Se reintentará cuando haya conexión.'
            });
          }
        } catch (error: any) {
          this.syncMessage.set({
            type: 'warning',
            text: 'Tiquete guardado localmente. Se sincronizará cuando haya conexión.'
          });
        }
      } else {
        this.syncMessage.set({
          type: 'warning',
          text: 'Sin conexión. Tiquete guardado localmente para sincronizar después.'
        });
      }

      // Clear input after short delay to show success message
      setTimeout(() => this.resetValidation(), 2000);
    } finally {
      this.isMarking.set(false);
    }
  }

  isAlreadyConsumed(): boolean {
    const result = this.validationResult();
    if (!result?.payload?.ticketId) return false;

    return this.storage.consumedTickets().some(
      t => t.ticketId === result.payload!.ticketId
    );
  }

  resetValidation(): void {
    this.tokenInput = '';
    this.validationResult.set(null);
    this.syncMessage.set(null);
  }

  loadExampleToken(): void {
    // Example JWT from the API response for testing
    this.tokenInput = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NGY5YjQzNi0zNWQ2LTQ4N2EtYjViYS1lZmQ5MjQwOTBjYjEiLCJ0aWNrZXRJZCI6Ijc0ZjliNDM2LTM1ZDYtNDg3YS1iNWJhLWVmZDkyNDA5MGNiMSIsInBhc3NlbmdlcklkIjoiYTUxYjFjMmUtODIxYy00YmQ4LTg4OGItNjJhNzYyMTljZDZiIiwicm91dGVJZCI6InJvdXRlLTAwMSIsImV4cGlyZXNBdCI6IjIwMzItMTItMTVUMTY6Mjk6MDYuNDEwWiIsImlhdCI6MTc4MjIzMjE0NywiZXhwIjoxNzkwMDA4MTQ3LCJpc3MiOiJ0aWNrZXRzLXNlcnZpY2UifQ.Bzl2DUu8muNP3Cud5XQwFmyZdFmjYgd5KvQtEjR2qGwqBRqBEqVFFQU0KffE5y1T6_mtdKXlXmobOAl_oBjhbqrIWLXEz3S5JvWcpTzNTo13oh904CIF2QYPgTgwEWuhtj7gt_39JZoXjKkttzWYwwFsYbol9TwT0cq_swRI70T-R6CeZz735kukrIDRCphJ162Zpe-iV3nmm2OzC3veD5k0HRYDUBzWF5t0ySijN3Tuj2DF3p1efZNKsUrTZP1G40q3YTPVO0NfLHMGUwl-1mWLXkmRt5Q5oPpV7DDqp5yIWJDFQfVjDpxNViPCLj0GsZyAG4ZQyb-w2cBLEhBopA';
  }

  constructor() {
    addIcons({ qrCodeOutline, checkmarkCircle, closeCircle, cameraOutline, imageOutline });
  }
}
