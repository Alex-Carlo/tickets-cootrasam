import { Injectable, inject, effect, signal, DOCUMENT } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { SyncResult } from '../models';
import { TicketApiService } from './ticket-api.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private readonly ticketApi = inject(TicketApiService);
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);

  private _isOnline = signal(this.document.defaultView?.navigator.onLine ?? false);
  private _isSyncing = signal(false);
  private _lastSyncTime = signal<string | null>(null);

  get isOnline() {
    return this._isOnline.asReadonly();
  }

  get isSyncing() {
    return this._isSyncing.asReadonly();
  }

  get lastSyncTime() {
    return this._lastSyncTime.asReadonly();
  }

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const window = this.document.defaultView;
    if (!window) return;

    window.addEventListener('online', () => {
      this._isOnline.set(true);
      this.syncPending().catch(err => console.error('Auto-sync failed:', err));
    });

    window.addEventListener('offline', () => {
      this._isOnline.set(false);
    });
  }

  startAutoSync(): void {
    // Called from AppComponent.ngOnInit
    if (this._isOnline()) {
      this.syncPending().catch(err => console.error('Initial sync failed:', err));
    }
  }

  async syncPending(): Promise<SyncResult> {
    if (!this._isOnline()) {
      throw new Error('No internet connection');
    }

    const pending = this.storage.getPendingTickets();
    if (pending.length === 0) {
      return {
        synced: 0,
        failed: 0,
        skipped: 0,
        details: []
      };
    }

    this._isSyncing.set(true);
    try {
      const ticketIds = pending.map(t => t.ticketId);
      const result = await firstValueFrom(
        this.ticketApi.syncConsumedTickets({ ticketIds })
      );

      // Mark synced tickets
      result.details.forEach(detail => {
        if (detail.result === 'synced') {
          this.storage.markTicketSynced(detail.ticketId);
        }
      });

      this._lastSyncTime.set(new Date().toISOString());
      return result;
    } finally {
      this._isSyncing.set(false);
    }
  }
}
