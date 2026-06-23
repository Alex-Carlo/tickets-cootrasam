import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { TicketService } from '../services/ticket.service';

interface ValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
}

interface SyncStatus {
  synced: number;
  skipped: number;
  failed: number;
  success: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput
  ],
})
export class HomePage implements OnInit {
  isInitialized = false;
  initError: string | null = null;

  passengerId = '';
  routeId = '';
  generatedTicket: any = null;

  tokenToValidate = '';
  validateRouteId = '';
  validationResult: ValidationResult | null = null;
  lastValidTokenId = '';

  consumedList: any[] = [];

  syncStatus: SyncStatus | null = null;

  navigator = navigator;

  constructor(private ticketService: TicketService) {}

  ngOnInit(): void {
    this.refreshConsumedList();
  }

  async initializeSystem(): Promise<void> {
    try {
      this.initError = null;
      await this.ticketService.downloadPublicKey();
      this.isInitialized = true;
    } catch (error: any) {
      this.initError = error.message;
    }
  }

  async generateTicket(): Promise<void> {
    if (!this.passengerId || !this.routeId) {
      alert('Fill in all fields');
      return;
    }

    try {
      this.generatedTicket = await this.ticketService.generateTicket(
        this.passengerId,
        this.routeId
      );
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  }

  validateToken(): void {
    if (!this.tokenToValidate) {
      alert('Paste a token');
      return;
    }

    const result = this.ticketService.validateTicketToken(
      this.tokenToValidate,
      this.validateRouteId || undefined
    );

    this.validationResult = {
      valid: result.valid,
      payload: result.payload,
      error: result.error
    };

    if (result.valid) {
      this.lastValidTokenId = result.payload.ticketId;
    }
  }

  markAsConsumed(): void {
    if (!this.lastValidTokenId) {
      alert('No valid token to consume');
      return;
    }

    this.ticketService.markTicketAsConsumed(this.lastValidTokenId);
    this.refreshConsumedList();
    alert('Marked as consumed');

    this.tokenToValidate = '';
    this.validateRouteId = '';
    this.validationResult = null;
  }

  async syncTickets(): Promise<void> {
    try {
      const result = await this.ticketService.syncConsumedTickets();
      this.syncStatus = {
        synced: result.synced,
        skipped: result.skipped,
        failed: result.failed,
        success: true
      };
      this.refreshConsumedList();
      alert('Sync complete!');
    } catch (error: any) {
      this.syncStatus = {
        synced: 0,
        skipped: 0,
        failed: 0,
        success: false
      };
      alert('Sync failed: ' + error.message);
    }
  }

  private refreshConsumedList(): void {
    this.consumedList = this.ticketService.getConsumedTickets();
  }
}
