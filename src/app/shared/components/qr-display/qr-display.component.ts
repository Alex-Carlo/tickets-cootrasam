import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { downloadOutline, shareOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonCard, IonCardContent],
  template: `
    <ion-card class="qr-card">
      <ion-card-content>
        <div class="qr-container">
          <img [src]="dataUrl" alt="QR Code" class="qr-image" />
        </div>
        <div class="qr-actions">
          <ion-button expand="block" (click)="onDownload()">
            <ion-icon name="download-outline" slot="start"></ion-icon>
            Descargar QR
          </ion-button>
          <ion-button expand="block" color="secondary" (click)="onShare()" *ngIf="supportsShare">
            <ion-icon name="share-outline" slot="start"></ion-icon>
            Compartir
          </ion-button>
        </div>
        <p class="hint-text">
          📱 Muestra este código QR al conductor para validar tu tiquete
        </p>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    :host {
      display: block;
    }

    .qr-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      margin: var(--space-lg) 0;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      padding: var(--space-lg);
      background-color: var(--color-surface-alt);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
    }

    .qr-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      border-radius: var(--radius-sm);
    }

    .qr-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .hint-text {
      text-align: center;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      margin: 0;
    }
  `]
})
export class QrDisplayComponent {
  @Input() dataUrl!: string;
  @Input() ticketId: string = '';
  @Output() download = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();

  supportsShare = !!navigator.share;

  onDownload(): void {
    this.download.emit();
  }

  onShare(): void {
    this.share.emit();
  }

  constructor() {
    addIcons({ downloadOutline, shareOutline });
  }
}
