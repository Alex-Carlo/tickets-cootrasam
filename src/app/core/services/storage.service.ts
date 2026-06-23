import { Injectable, effect, signal } from '@angular/core';
import { ConsumedTicket } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly KEYS = {
    publicKey: 'TICKET_PUBLIC_KEY',
    consumedTickets: 'consumed_tickets'
  };

  private _publicKey = signal<string | null>(this.loadPublicKey());
  private _consumedTickets = signal<ConsumedTicket[]>(this.loadConsumedTickets());

  get publicKey() {
    return this._publicKey.asReadonly();
  }

  get consumedTickets() {
    return this._consumedTickets.asReadonly();
  }

  constructor() {
    effect(() => {
      localStorage.setItem(this.KEYS.consumedTickets, JSON.stringify(this._consumedTickets()));
    });
  }

  setPublicKey(key: string): void {
    this._publicKey.set(key);
    localStorage.setItem(this.KEYS.publicKey, key);
  }

  saveConsumedTicket(ticket: ConsumedTicket): void {
    const current = this._consumedTickets();
    const exists = current.some(t => t.ticketId === ticket.ticketId);
    if (!exists) {
      this._consumedTickets.set([...current, ticket]);
    }
  }

  markTicketSynced(ticketId: string): void {
    const updated = this._consumedTickets().map(t =>
      t.ticketId === ticketId ? { ...t, synced: true } : t
    );
    this._consumedTickets.set(updated);
  }

  clearSyncedTickets(): void {
    const pending = this._consumedTickets().filter(t => !t.synced);
    this._consumedTickets.set(pending);
  }

  getPendingTickets(): ConsumedTicket[] {
    return this._consumedTickets().filter(t => !t.synced);
  }

  private loadPublicKey(): string | null {
    return localStorage.getItem(this.KEYS.publicKey);
  }

  private loadConsumedTickets(): ConsumedTicket[] {
    try {
      const data = localStorage.getItem(this.KEYS.consumedTickets);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
