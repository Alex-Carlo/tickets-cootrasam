import { Injectable, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private auth = inject(AuthService);
  private router = inject(Router);

  private refreshSubscription: Subscription | null = null;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.setupAutoRefresh();
  }

  private setupAutoRefresh(): void {
    effect(() => {
      const isAuthenticated = this.auth.isAuthenticated();

      if (isAuthenticated && !this.refreshSubscription) {
        this.startRefresh();
      } else if (!isAuthenticated && this.refreshSubscription) {
        this.stopRefresh();
      }
    });
  }

  private startRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() =>
          this.auth.refreshToken().pipe(
            catchError((error) => {
              console.error('Token refresh failed:', error);
              this.auth.logout();
              this.router.navigate(['/auth/login']);
              return of(null);
            })
          )
        )
      )
      .subscribe();
  }

  private stopRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }
}
