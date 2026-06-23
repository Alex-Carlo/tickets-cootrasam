import { Injectable, inject } from '@angular/core';
import { TicketPayload, ValidationResult } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class JwtValidationService {
  private readonly storage = inject(StorageService);

  validate(token: string, routeId?: string): ValidationResult {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          valid: false,
          payload: null,
          error: 'Invalid token format'
        };
      }

      const decodedPayload = this.base64UrlDecode(parts[1]);
      const payload = JSON.parse(decodedPayload) as TicketPayload;

      // Check expiration
      const expiresAt = new Date(payload.expiresAt);
      if (expiresAt < new Date()) {
        return {
          valid: false,
          payload,
          error: 'Ticket expired'
        };
      }

      // Check route match if provided
      if (routeId && payload.routeId !== routeId) {
        return {
          valid: false,
          payload,
          error: 'Route mismatch'
        };
      }

      return {
        valid: true,
        payload
      };
    } catch (error: any) {
      return {
        valid: false,
        payload: null,
        error: error.message || 'Validation failed'
      };
    }
  }

  private base64UrlDecode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Invalid base64url string');
    }
    return atob(output);
  }
}
