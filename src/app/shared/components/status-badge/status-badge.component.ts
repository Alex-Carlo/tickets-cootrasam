import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { checkmarkCircle, closeCircle, timerOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, IonChip, IonIcon, IonLabel],
  template: `
    <ion-chip [ngClass]="'status-' + status">
      <ion-icon [name]="icon"></ion-icon>
      <ion-label>{{ label }}</ion-label>
    </ion-chip>
  `,
  styles: [`
    :host {
      --status-active: #2ecc71;
      --status-consumed: #95a5a6;
      --status-expired: #e74c3c;
    }

    ion-chip.status-active {
      --background: var(--status-active);
      --color: white;
    }

    ion-chip.status-consumed {
      --background: var(--status-consumed);
      --color: white;
    }

    ion-chip.status-expired {
      --background: var(--status-expired);
      --color: white;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: 'active' | 'consumed' | 'expired' = 'active';

  get label(): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      consumed: 'Usado',
      expired: 'Expirado'
    };
    return labels[this.status] || 'Desconocido';
  }

  get icon(): string {
    const icons: Record<string, string> = {
      active: 'checkmark-circle',
      consumed: 'checkmark-circle',
      expired: 'close-circle'
    };
    return icons[this.status] || 'help-circle';
  }

  constructor() {
    addIcons({ checkmarkCircle, closeCircle, timerOutline });
  }
}
