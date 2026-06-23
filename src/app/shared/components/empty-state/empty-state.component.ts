import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, documentOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="empty-container">
      <ion-icon [name]="icon" class="empty-icon"></ion-icon>
      <h3>{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--space-lg);
      text-align: center;
    }

    .empty-container {
      padding: var(--space-xxl) var(--space-lg);
    }

    .empty-icon {
      font-size: 64px;
      color: var(--color-text-muted);
      margin-bottom: var(--space-lg);
    }

    h3 {
      color: var(--color-on-surface);
      margin: var(--space-md) 0;
      font-size: var(--font-size-lg);
    }

    .empty-message {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'document-outline';
  @Input() title: string = 'Sin datos';
  @Input() message: string = 'No hay elementos para mostrar';

  constructor() {
    addIcons({ informationCircleOutline, documentOutline });
  }
}
