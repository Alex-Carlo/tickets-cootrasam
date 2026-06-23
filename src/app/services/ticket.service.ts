import { Injectable } from '@angular/core';

interface Ticket {
  id: string;
  passengerId: string;
  routeId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  token: string;
}

interface ConsumedTicket {
  ticketId: string;
  consumedAt: string;
}

interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  details: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://localhost:3000/api/tickets';
  private publicKey: string | null = null;
  private consumedTickets: ConsumedTicket[] = [];
  private readonly STORAGE_KEYS = {
    publicKey: 'TICKET_PUBLIC_KEY',
    consumedTickets: 'consumed_tickets'
  };

  constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
  }

  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  async downloadPublicKey(): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/public-key`);
      if (!response.ok) throw new Error('Failed to download public key');

      const { publicKey } = await response.json();
      this.publicKey = publicKey;
      localStorage.setItem(this.STORAGE_KEYS.publicKey, publicKey);

      return publicKey;
    } catch (error) {
      console.error('Error downloading public key:', error);
      throw error;
    }
  }

  async generateTicket(passengerId: string, routeId: string): Promise<Ticket> {
    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerId, routeId })
      });

      if (!response.ok) throw new Error('Failed to generate ticket');

      const ticket = await response.json();
      return ticket;
    } catch (error) {
      console.error('Error generating ticket:', error);
      throw error;
    }
  }

  async getTicketDetails(ticketId: string): Promise<Ticket> {
    try {
      const response = await fetch(`${this.apiUrl}/${ticketId}`);
      if (!response.ok) throw new Error('Ticket not found');

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  }

  async getPassengerTickets(passengerId: string): Promise<Ticket[]> {
    try {
      const response = await fetch(`${this.apiUrl}/passenger/${passengerId}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');

      return await response.json();
    } catch (error) {
      console.error('Error fetching passenger tickets:', error);
      throw error;
    }
  }

  async getRouteTickets(routeId: string): Promise<Ticket[]> {
    try {
      const response = await fetch(`${this.apiUrl}/route/${routeId}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');

      return await response.json();
    } catch (error) {
      console.error('Error fetching route tickets:', error);
      throw error;
    }
  }

  validateTicketToken(token: string, routeId?: string): { valid: boolean; payload: any; error?: string } {
    try {
      if (!this.publicKey) {
        return { valid: false, payload: null, error: 'Public key not loaded' };
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, payload: null, error: 'Invalid token format' };
      }

      const payload = JSON.parse(atob(parts[1]));

      const expiresAt = new Date(payload.expiresAt);
      if (expiresAt < new Date()) {
        return { valid: false, payload, error: 'Ticket expired' };
      }

      if (routeId && payload.routeId !== routeId) {
        return { valid: false, payload, error: 'Route mismatch' };
      }

      return { valid: true, payload };
    } catch (error: any) {
      return { valid: false, payload: null, error: error.message };
    }
  }

  markTicketAsConsumed(ticketId: string): void {
    const existing = this.consumedTickets.find(t => t.ticketId === ticketId);
    if (!existing) {
      this.consumedTickets.push({
        ticketId,
        consumedAt: new Date().toISOString()
      });
      this.saveToStorage();
    }
  }

  getConsumedTickets(): ConsumedTicket[] {
    return [...this.consumedTickets];
  }

  async syncConsumedTickets(): Promise<SyncResult> {
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    if (this.consumedTickets.length === 0) {
      return { synced: 0, failed: 0, skipped: 0, details: [] };
    }

    try {
      const ticketIds = this.consumedTickets.map(t => t.ticketId);

      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds })
      });

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();

      this.consumedTickets = [];
      this.saveToStorage();

      return result;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('Internet connection restored');
      this.syncConsumedTickets().catch(err => console.error('Auto-sync failed:', err));
    });

    window.addEventListener('offline', () => {
      console.log('Internet connection lost - working offline');
    });
  }

  private loadFromStorage(): void {
    const publicKey = localStorage.getItem(this.STORAGE_KEYS.publicKey);
    if (publicKey) {
      this.publicKey = publicKey;
    }

    const consumed = localStorage.getItem(this.STORAGE_KEYS.consumedTickets);
    if (consumed) {
      try {
        this.consumedTickets = JSON.parse(consumed);
      } catch (error) {
        this.consumedTickets = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEYS.consumedTickets, JSON.stringify(this.consumedTickets));
  }
}
