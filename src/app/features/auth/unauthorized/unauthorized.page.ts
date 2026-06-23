import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Acceso Denegado</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="unauthorized-container">
        <ion-icon name="alert-circle-outline" class="icon"></ion-icon>
        <h1>Acceso No Autorizado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>

        <ion-button
          expand="block"
          color="primary"
          (click)="goBack()"
        >
          Volver
        </ion-button>

        <ion-button
          expand="block"
          color="light"
          (click)="logout()"
        >
          Cerrar Sesión
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: var(--space-lg);
      text-align: center;
    }

    .icon {
      font-size: 72px;
      color: var(--color-danger);
      margin-bottom: var(--space-lg);
    }

    h1 {
      color: var(--color-on-surface);
      margin-bottom: var(--space-md);
    }

    p {
      color: var(--color-text-muted);
      margin-bottom: var(--space-xxl);
      max-width: 400px;
    }

    ion-button {
      margin-bottom: var(--space-md);
    }
  `]
})
export class UnauthorizedPage {
  private router = inject(Router);
  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.router.navigate(['/auth/login']);
  }

  constructor() {
    addIcons({ alertCircleOutline });
  }
}
