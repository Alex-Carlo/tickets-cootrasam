import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonInput, IonButton, IonText, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterCredentials } from '../../../core/models';

@Component({
  selector: 'app-register',
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
        <ion-title>Crear Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="register-container">
        <div class="logo-section">
          <ion-icon name="ticket-outline" class="logo"></ion-icon>
          <h1>Tickets Sam</h1>
          <p>Crea tu cuenta</p>
        </div>

        <ion-card class="register-card">
          <ion-card-content>
            <form (ngSubmit)="register()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <ion-input
                    [(ngModel)]="formData.firstName"
                    name="firstName"
                    type="text"
                    placeholder="Juan"
                    [disabled]="isLoading()"
                    required
                  ></ion-input>
                </div>

                <div class="form-group">
                  <label>Apellido</label>
                  <ion-input
                    [(ngModel)]="formData.lastName"
                    name="lastName"
                    type="text"
                    placeholder="Pérez"
                    [disabled]="isLoading()"
                    required
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label>Email</label>
                <ion-input
                  [(ngModel)]="formData.email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  [disabled]="isLoading()"
                  required
                ></ion-input>
              </div>

              <div class="form-group">
                <label>¿Cuál es tu rol?</label>
                <div class="role-selector">
                  <ion-button
                    expand="block"
                    [color]="selectedRole === 'passenger' ? 'primary' : 'light'"
                    (click)="selectedRole = 'passenger'"
                    [disabled]="isLoading()"
                  >
                    👤 Pasajero
                  </ion-button>
                  <ion-button
                    expand="block"
                    [color]="selectedRole === 'driver' ? 'primary' : 'light'"
                    (click)="selectedRole = 'driver'"
                    [disabled]="isLoading()"
                  >
                    🚗 Conductor
                  </ion-button>
                </div>
              </div>

              <div class="form-group">
                <label>Contraseña</label>
                <ion-input
                  [(ngModel)]="formData.password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  [disabled]="isLoading()"
                  required
                ></ion-input>
                <small>Mínimo 8 caracteres</small>
              </div>

              <div class="form-group">
                <label>Confirmar Contraseña</label>
                <ion-input
                  [(ngModel)]="formData.confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  [disabled]="isLoading()"
                  required
                ></ion-input>
              </div>

              <ion-button
                expand="block"
                color="primary"
                type="submit"
                [disabled]="isLoading()"
              >
                {{ isLoading() ? 'Registrando...' : 'Crear Cuenta' }}
              </ion-button>
            </form>

            <div class="auth-footer">
              <p>
                ¿Ya tienes cuenta?
                <a routerLink="/auth/login">Iniciar sesión</a>
              </p>
            </div>

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

    .register-container {
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

    .register-card {
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    .form-group {
      margin-bottom: var(--space-lg);
      display: flex;
      flex-direction: column;
    }

    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }

    label {
      color: var(--color-on-surface);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    small {
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      margin-top: var(--space-xs);
    }

    ion-input {
      --padding-start: var(--space-md);
      --padding-end: var(--space-md);
      --padding-top: var(--space-md);
      --padding-bottom: var(--space-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }

    .auth-footer {
      text-align: center;
      margin-top: var(--space-lg);
      font-size: var(--font-size-sm);
    }

    .auth-footer a {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    .error-message {
      color: var(--color-danger);
      padding: var(--space-md);
      background-color: rgba(231, 76, 60, 0.1);
      border-radius: var(--radius-sm);
      margin-top: var(--space-md);
      font-size: var(--font-size-sm);
      border-left: 4px solid var(--color-danger);
    }
  `]
})
export class RegisterPage {
  private auth = inject(AuthService);
  router = inject(Router);

  formData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  };

  selectedRole: 'passenger' | 'driver' = 'passenger';
  isLoading = signal(false);
  error = signal<string | null>(null);

  register(): void {
    this.error.set(null);

    // Validación
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email || !this.formData.password) {
      this.error.set('Todos los campos son requeridos');
      return;
    }

    if (this.formData.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.error.set('Email inválido');
      return;
    }

    this.isLoading.set(true);

    const credentials: RegisterCredentials = {
      email: this.formData.email,
      password: this.formData.password,
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      role: this.selectedRole
    };

    this.auth.register(credentials, this.selectedRole).subscribe({
      next: (response) => {
        const route = this.selectedRole === 'driver' ? '/driver/scanner' : '/passenger/routes';
        this.router.navigate([route]);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al registrarse');
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
