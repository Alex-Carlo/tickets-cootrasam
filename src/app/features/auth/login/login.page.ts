import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonInput,
    IonButton,
    IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Tickets Sam</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="login-container">
        <div class="logo-section">
          <ion-icon name="ticket-outline" class="logo"></ion-icon>
          <h1>Tickets Sam</h1>
          <p>Sistema de Tiquetes Inteligente</p>
        </div>

        <ion-card class="login-card">
          <ion-card-content>
            <h2>Inicia sesión</h2>

            <div class="role-selector">
              <p class="instruction">¿Cuál es tu rol?</p>
              <div class="role-buttons">
                <ion-button
                  expand="block"
                  [color]="selectedRole === 'passenger' ? 'primary' : 'light'"
                  (click)="selectedRole = 'passenger'"
                >
                  👤 Pasajero
                </ion-button>
                <ion-button
                  expand="block"
                  [color]="selectedRole === 'driver' ? 'primary' : 'light'"
                  (click)="selectedRole = 'driver'"
                >
                  🚗 Conductor
                </ion-button>
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <ion-input
                [(ngModel)]="email"
                type="email"
                placeholder="tu@email.com"
                [disabled]="isLoading()"
              ></ion-input>
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <ion-input
                [(ngModel)]="password"
                type="password"
                placeholder="••••••••"
                [disabled]="isLoading()"
              ></ion-input>
            </div>

            <ion-button
              expand="block"
              color="primary"
              (click)="login()"
              [disabled]="isLoading()"
            >
              {{ isLoading() ? 'Cargando...' : 'Iniciar Sesión' }}
            </ion-button>

            <p class="hint">
              <small>
                ¿No tienes cuenta? <a routerLink="/auth/register">Crear una</a>
              </small>
            </p>

            <div *ngIf="error()" class="error-message">
              {{ error() }}
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

    .login-container {
      display: flex;
      flex-direction: column;
      padding: var(--space-lg);
      min-height: 100vh;
      justify-content: center;
    }

    .logo-section {
      text-align: center;
      margin-bottom: var(--space-xxl);
    }

    .logo {
      font-size: 72px;
      color: var(--color-primary);
      display: block;
      margin-bottom: var(--space-lg);
    }

    .logo-section h1 {
      margin: var(--space-md) 0 var(--space-xs);
      color: var(--color-on-surface);
    }

    .logo-section p {
      color: var(--color-text-muted);
      margin: 0;
    }

    .login-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    h2 {
      color: var(--color-on-surface);
      margin-bottom: var(--space-lg);
      text-align: center;
    }

    .instruction {
      color: var(--color-on-surface);
      margin-bottom: var(--space-md);
      font-weight: var(--font-weight-medium);
    }

    .role-selector {
      margin-bottom: var(--space-lg);
    }

    .role-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .form-group {
      margin-bottom: var(--space-lg);
      display: flex;
      flex-direction: column;
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

    .hint {
      text-align: center;
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      margin: var(--space-lg) 0 0;
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
export class LoginPage {
  private auth = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  selectedRole: 'passenger' | 'driver' = 'passenger';
  isLoading = signal(false);
  error = signal<string | null>(null);

  login(): void {
    if (!this.email || !this.password) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const credentials: LoginCredentials = {
      email: this.email,
      password: this.password
    };

    this.auth.login(credentials, this.selectedRole).subscribe({
      next: (response) => {
        const route = this.selectedRole === 'driver' ? '/driver/scanner' : '/passenger/routes';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al iniciar sesión');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  constructor() {
    addIcons({ ticketOutline });
  }
}
