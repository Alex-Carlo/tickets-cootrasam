import { InjectionToken } from '@angular/core';

// === Entities ===

export interface Ticket {
  id: string;
  passengerId: string;
  routeId: string;
  status: 'active' | 'consumed' | 'expired';
  expiresAt: string;
  createdAt: string;
  token: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  departureTime?: string;
  price: number;
}

export interface Passenger {
  id: string;
  name: string;
  email: string;
}

// === JWT & Validation ===

export interface TicketPayload {
  sub: string;
  ticketId: string;
  passengerId: string;
  routeId: string;
  expiresAt: string;
  iat: number;
  exp: number;
}

export interface ValidationResult {
  valid: boolean;
  payload: TicketPayload | null;
  error?: string;
}

// === Offline & Sync ===

export interface ConsumedTicket {
  ticketId: string;
  routeId: string;
  consumedAt: string;
  synced: boolean;
}

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  details: SyncDetail[];
}

export interface SyncDetail {
  ticketId: string;
  result: 'synced' | 'skipped' | 'failed';
  reason?: string;
}

// === API Requests ===

export interface GenerateTicketRequest {
  passengerId: string;
  routeId: string;
}

export interface SyncRequest {
  ticketIds: string[];
}

// === Authentication ===

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'passenger' | 'driver';
}

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role?: 'passenger' | 'driver';
  token: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

// === Injection Tokens ===

export const API_URL_TOKEN = new InjectionToken<string>('API_URL');
