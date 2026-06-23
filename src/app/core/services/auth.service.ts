import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginCredentials, RegisterCredentials, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'currentUser',
  };

  private _currentUser = signal<AuthUser | null>(this.loadUserFromStorage());
  private _isAuthenticated = signal(this._currentUser() !== null);

  get currentUser() {
    return this._currentUser.asReadonly();
  }

  get isAuthenticated() {
    return this._isAuthenticated.asReadonly();
  }

  get userRole() {
    return this._currentUser()?.role || null;
  }

  login(credentials: LoginCredentials, role?: 'passenger' | 'driver'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => this._handleAuthResponse(response, role)),
      catchError(error => this._handleError(error))
    );
  }

  register(credentials: RegisterCredentials, role?: 'passenger' | 'driver'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, credentials).pipe(
      tap(response => this._handleAuthResponse(response, role)),
      catchError(error => this._handleError(error))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => this._handleAuthResponse(response)),
      catchError(error => {
        this.logout();
        return this._handleError(error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const token = this.getAccessToken();

    if (!token) {
      return throwError(() => new Error('Not authenticated'));
    }

    return this.http.patch<void>(`${this.API_URL}/password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => this._handleError(error))
    );
  }

  logout(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  getCurrentUser(): AuthUser | null {
    return this._currentUser();
  }

  isPassenger(): boolean {
    return this._currentUser()?.role === 'passenger';
  }

  isDriver(): boolean {
    return this._currentUser()?.role === 'driver';
  }

  private _handleAuthResponse(response: AuthResponse, role?: 'passenger' | 'driver'): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

    const user: AuthUser = {
      ...response.user,
      token: response.accessToken,
      role: role || response.user.role
    };

    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private _handleError(error: any) {
    const message = error?.error?.message || 'Authentication error';
    console.error('Auth error:', message);
    return throwError(() => new Error(message));
  }
}
