import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Tickets Sam</ion-title>

        <ion-buttons slot="end">
          <div class="user-info" *ngIf="currentUser()">
            <span class="user-name">{{ currentUser()?.name }}</span>
            <ion-badge class="role-badge">{{ currentUser()?.role === 'driver' ? '🚗 Conductor' : '👤 Pasajero' }}</ion-badge>
          </div>

          <ion-button (click)="logout()" fill="clear" color="light">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    ion-header {
      --background: var(--color-primary);
      --color: var(--color-on-primary);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-right: var(--space-md);
    }

    .user-name {
      font-size: var(--font-size-sm);
      color: var(--color-on-primary);
    }

    .role-badge {
      font-size: var(--font-size-xs);
      padding: 4px 8px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    ion-button {
      --color: var(--color-on-primary);
    }
  `]
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  get currentUser() {
    return this.auth.currentUser;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  constructor() {
    addIcons({ logOutOutline });
  }
}
