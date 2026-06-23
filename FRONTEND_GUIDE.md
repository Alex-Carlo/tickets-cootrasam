# Guía Frontend - Módulo de Tiquetes Prepagados

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
4. [Instalación de Dependencias](#instalación-de-dependencias)
5. [Implementación Offline-First](#implementación-offline-first)
6. [Ejemplos de Código](#ejemplos-de-código)
7. [Manejo de Errores](#manejo-de-errores)
8. [Testing](#testing)

---

## Descripción General

El módulo de tiquetes prepagados permite:
- **Generar tiquetes** con JWT firmados (RS256)
- **Validar offline** sin conexión a internet
- **Sincronizar masivamente** cuando hay conexión
- **Rastrear consumo** de tiquetes

### Arquitectura

```
┌─────────────────────────────────────┐
│  Backend (API)                      │
│  POST /tickets/generate             │
│  POST /tickets/sync                 │
│  GET /tickets/public-key            │
└─────────────────────────────────────┘
         ↓ JWT + Clave Pública
┌─────────────────────────────────────┐
│  PWA Frontend (Offline-First)       │
│  ├─ Descargar clave pública         │
│  ├─ Validar JWTs offline            │
│  ├─ Guardar consumo en localStorage │
│  └─ Sincronizar cuando hay internet │
└─────────────────────────────────────┘
```

---

## Autenticación

Los endpoints **NO requieren autenticación JWT** (están públicos para conductores offline).

Si tu API requiere autenticación general, usa:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${tu_token}` // Si es necesario
};
```

---

## Endpoints

### 1. Generar Tiquete

**POST** `/tickets/generate`

Crea un nuevo tiquete prepagado y devuelve un JWT firmado.

#### Request

```json
{
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "bogota-medellin"
}
```

#### Response (201 Created)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "bogota-medellin",
  "status": "active",
  "expiresAt": "2026-09-20T14:30:00.000Z",
  "createdAt": "2026-06-22T14:30:00.000Z",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ejemplo JavaScript

```typescript
async function generateTicket(passengerId: string, routeId: string) {
  const response = await fetch('http://api.example.com/tickets/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passengerId, routeId })
  });

  if (!response.ok) throw new Error('Failed to generate ticket');
  
  const ticket = await response.json();
  return ticket; // { id, token, status, expiresAt, ... }
}
```

---

### 2. Obtener Clave Pública

**GET** `/tickets/public-key`

Descarga la clave pública para validar JWTs offline. **Ejecuta esto al inicializar la PWA.**

#### Response (200)

```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
}
```

#### Ejemplo JavaScript

```typescript
async function downloadPublicKey(): Promise<string> {
  const response = await fetch('http://api.example.com/tickets/public-key');
  
  if (!response.ok) throw new Error('Failed to download public key');
  
  const { publicKey } = await response.json();
  localStorage.setItem('TICKET_PUBLIC_KEY', publicKey);
  
  return publicKey;
}
```

---

### 3. Sincronizar Tiquetes Consumidos

**POST** `/tickets/sync`

Sincroniza tiquetes consumidos offline. **Idempotente** - puedes llamarlo N veces sin error.

#### Request

```json
{
  "ticketIds": [
    "660e8400-e29b-41d4-a716-446655440000",
    "770e8400-e29b-41d4-a716-446655440001",
    "880e8400-e29b-41d4-a716-446655440002"
  ]
}
```

#### Response (200)

```json
{
  "synced": 2,
  "failed": 0,
  "skipped": 1,
  "details": [
    {
      "ticketId": "660e8400-e29b-41d4-a716-446655440000",
      "result": "synced"
    },
    {
      "ticketId": "770e8400-e29b-41d4-a716-446655440001",
      "result": "synced"
    },
    {
      "ticketId": "880e8400-e29b-41d4-a716-446655440002",
      "result": "skipped",
      "reason": "Already consumed"
    }
  ]
}
```

#### Ejemplo JavaScript

```typescript
async function syncConsumedTickets(ticketIds: string[]) {
  const response = await fetch('http://api.example.com/tickets/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketIds })
  });

  if (!response.ok) throw new Error('Sync failed');
  
  const result = await response.json();
  return result; // { synced, failed, skipped, details }
}
```

---

### 4. Obtener Detalles del Tiquete

**GET** `/tickets/{id}`

Obtiene los detalles de un tiquete específico.

#### Response (200)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "bogota-medellin",
  "status": "active",
  "expiresAt": "2026-09-20T14:30:00.000Z",
  "createdAt": "2026-06-22T14:30:00.000Z"
}
```

#### Ejemplo JavaScript

```typescript
async function getTicketDetails(ticketId: string) {
  const response = await fetch(
    `http://api.example.com/tickets/${ticketId}`
  );

  if (!response.ok) throw new Error('Ticket not found');
  
  return await response.json();
}
```

---

### 5. Tiquetes por Pasajero

**GET** `/tickets/passenger/{passengerId}`

Obtiene todos los tiquetes activos de un pasajero.

#### Response (200)

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "passengerId": "550e8400-e29b-41d4-a716-446655440000",
    "routeId": "bogota-medellin",
    "status": "active",
    "expiresAt": "2026-09-20T14:30:00.000Z",
    "createdAt": "2026-06-22T14:30:00.000Z"
  }
]
```

#### Ejemplo JavaScript

```typescript
async function getPassengerTickets(passengerId: string) {
  const response = await fetch(
    `http://api.example.com/tickets/passenger/${passengerId}`
  );

  if (!response.ok) throw new Error('Failed to fetch tickets');
  
  return await response.json(); // Array de tiquetes
}
```

---

### 6. Tiquetes por Ruta

**GET** `/tickets/route/{routeId}`

Obtiene todos los tiquetes activos de una ruta específica.

#### Response (200)

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "passengerId": "550e8400-e29b-41d4-a716-446655440000",
    "routeId": "bogota-medellin",
    "status": "active",
    "expiresAt": "2026-09-20T14:30:00.000Z",
    "createdAt": "2026-06-22T14:30:00.000Z"
  }
]
```

#### Ejemplo JavaScript

```typescript
async function getRouteTickets(routeId: string) {
  const response = await fetch(
    `http://api.example.com/tickets/route/${routeId}`
  );

  if (!response.ok) throw new Error('Failed to fetch tickets');
  
  return await response.json(); // Array de tiquetes
}
```

---

## Instalación de Dependencias

Para validar JWTs en el frontend necesitas:

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

O si usas una librería simplificada (recomendado para PWA):

```bash
npm install jwt-decode
```

---

## Implementación Offline-First

### Paso 1: Inicializar al Cargar la PWA

```typescript
class TicketManager {
  private publicKey: string;
  private apiUrl = 'http://api.example.com';

  async initialize() {
    try {
      // Descargar clave pública UNA sola vez
      const response = await fetch(`${this.apiUrl}/tickets/public-key`);
      const { publicKey } = await response.json();
      
      this.publicKey = publicKey;
      localStorage.setItem('TICKET_PUBLIC_KEY', publicKey);
      
      console.log('✓ Ticket system initialized');
    } catch (error) {
      console.error('Failed to initialize tickets:', error);
    }
  }
}
```

### Paso 2: Validar Tiquete Offline (Sin Internet)

```typescript
import * as jwt from 'jsonwebtoken';
// O si usas jwt-decode:
// import { jwtDecode } from 'jwt-decode';

interface TicketPayload {
  sub: string;
  ticketId: string;
  passengerId: string;
  routeId: string;
  expiresAt: string;
  iat: number;
  exp: number;
}

function validateTicketToken(token: string): TicketPayload | null {
  try {
    const publicKey = localStorage.getItem('TICKET_PUBLIC_KEY');
    
    if (!publicKey) {
      console.error('Public key not loaded');
      return null;
    }

    // Opción 1: Usar jsonwebtoken
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'tickets-service'
    }) as TicketPayload;

    // Opción 2: Usar jwt-decode (más ligero)
    // const payload = jwtDecode<TicketPayload>(token);

    // Validar expiración
    const expiresAt = new Date(payload.expiresAt);
    if (expiresAt < new Date()) {
      console.error('Ticket expired');
      return null;
    }

    console.log('✓ Ticket válido:', payload.ticketId);
    return payload;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return null;
  }
}
```

### Paso 3: Guardar Consumo Offline

```typescript
function markTicketAsConsumed(ticketId: string): void {
  const consumed = JSON.parse(
    localStorage.getItem('consumed_tickets') || '[]'
  );

  if (!consumed.includes(ticketId)) {
    consumed.push(ticketId);
    localStorage.setItem('consumed_tickets', JSON.stringify(consumed));
    console.log(`✓ Ticket ${ticketId} marked as consumed`);
  }
}

function getConsumedTickets(): string[] {
  return JSON.parse(localStorage.getItem('consumed_tickets') || '[]');
}
```

### Paso 4: Sincronizar Cuando Hay Internet

```typescript
async function syncConsumedTickets(): Promise<void> {
  // Verificar conexión
  if (!navigator.onLine) {
    console.log('No internet connection');
    return;
  }

  const ticketIds = getConsumedTickets();

  if (ticketIds.length === 0) {
    console.log('No tickets to sync');
    return;
  }

  try {
    const response = await fetch(`${this.apiUrl}/tickets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketIds })
    });

    if (!response.ok) throw new Error('Sync failed');

    const result = await response.json();
    
    console.log(`✓ Synced: ${result.synced}, Skipped: ${result.skipped}`);
    
    // Limpiar después de sincronizar exitosamente
    localStorage.removeItem('consumed_tickets');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Detectar conexión y sincronizar automáticamente
window.addEventListener('online', () => {
  console.log('Internet connection restored');
  syncConsumedTickets();
});

window.addEventListener('offline', () => {
  console.log('Internet connection lost - working offline');
});
```

---

## Ejemplos de Código

### Ejemplo Completo: Sistema de Validación de Tiquetes

```typescript
import * as jwt from 'jsonwebtoken';

interface ConsumedTicket {
  ticketId: string;
  consumedAt: string;
}

class TicketValidationSystem {
  private publicKey: string;
  private apiUrl: string;
  private consumedTickets: ConsumedTicket[] = [];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.loadFromStorage();
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/tickets/public-key`);
      const { publicKey } = await response.json();
      this.publicKey = publicKey;
      localStorage.setItem('TICKET_PUBLIC_KEY', publicKey);
      console.log('✓ Ticket system ready');
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  validateAndConsume(token: string, routeId: string): boolean {
    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'tickets-service'
      }) as any;

      // Validar que es la ruta correcta
      if (payload.routeId !== routeId) {
        console.error('Route mismatch');
        return false;
      }

      // Validar expiración
      if (new Date(payload.expiresAt) < new Date()) {
        console.error('Ticket expired');
        return false;
      }

      // Marcar como consumido
      this.consumedTickets.push({
        ticketId: payload.ticketId,
        consumedAt: new Date().toISOString()
      });

      this.saveToStorage();
      console.log(`✓ Ticket ${payload.ticketId} consumed`);
      return true;
    } catch (error) {
      console.error('Validation failed:', error.message);
      return false;
    }
  }

  async syncWithServer(): Promise<void> {
    if (this.consumedTickets.length === 0) {
      console.log('No tickets to sync');
      return;
    }

    try {
      const ticketIds = this.consumedTickets.map(t => t.ticketId);
      
      const response = await fetch(`${this.apiUrl}/tickets/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds })
      });

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();
      
      console.log(`Sync result: ${result.synced} synced, ${result.skipped} skipped`);
      
      // Limpiar
      this.consumedTickets = [];
      this.saveToStorage();
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => this.syncWithServer());
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('consumed_tickets');
    if (stored) {
      this.consumedTickets = JSON.parse(stored);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('consumed_tickets', JSON.stringify(this.consumedTickets));
  }
}

// Uso
const ticketSystem = new TicketValidationSystem('http://api.example.com');
await ticketSystem.initialize();

// En el flujo de validación (conductor escanea QR)
const jwtFromQR = 'eyJhbGciOiJSUzI1NiI...';
const isValid = ticketSystem.validateAndConsume(jwtFromQR, 'bogota-medellin');

if (isValid) {
  console.log('✓ Pasajero puede entrar');
} else {
  console.log('✗ Tiquete inválido');
}
```

### Ejemplo: Generar y Descargar Tiquete

```typescript
async function createAndDownloadTicket(
  passengerId: string,
  routeId: string
): Promise<void> {
  try {
    // 1. Generar tiquete en el backend
    const response = await fetch('http://api.example.com/tickets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerId, routeId })
    });

    if (!response.ok) throw new Error('Failed to generate ticket');

    const ticket = await response.json();
    const { id, token, expiresAt } = ticket;

    // 2. Generar QR con el JWT
    const qrContainer = document.getElementById('qr-code');
    const qr = new QRCode(qrContainer, {
      text: token,
      width: 300,
      height: 300
    });

    // 3. Mostrar información
    console.log(`
      Tiquete generado:
      ID: ${id}
      Válido hasta: ${expiresAt}
      QR: ${token.substring(0, 50)}...
    `);

    // 4. Permitir descarga
    const link = document.createElement('a');
    link.href = qrContainer.querySelector('canvas').toDataURL();
    link.download = `ticket-${id}.png`;
    link.click();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Manejo de Errores

### Errores Comunes y Soluciones

```typescript
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit
): Promise<any> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error: ApiError = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Bad Request:', error.message);
          break;
        case 404:
          console.error('Not Found:', error.message);
          break;
        case 422:
          console.error('Validation Error:', error.message);
          break;
        case 500:
          console.error('Server Error:', error.message);
          break;
        default:
          console.error('Unknown Error:', error.message);
      }
      
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Network Error:', error);
    throw error;
  }
}
```

### Validación de Entrada

```typescript
function validatePassengerId(id: string): boolean {
  // UUID v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
}

function validateRouteId(routeId: string): boolean {
  return routeId && routeId.length > 0 && routeId.length < 100;
}

async function safeGenerateTicket(
  passengerId: string,
  routeId: string
): Promise<any> {
  if (!validatePassengerId(passengerId)) {
    throw new Error('Invalid passenger ID');
  }

  if (!validateRouteId(routeId)) {
    throw new Error('Invalid route ID');
  }

  return fetchWithErrorHandling('http://api.example.com/tickets/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passengerId, routeId })
  });
}
```

---

## Testing

### Tests Unitarios (Jest)

```typescript
import * as jwt from 'jsonwebtoken';

describe('TicketValidationSystem', () => {
  let system: TicketValidationSystem;
  let mockPublicKey: string;

  beforeEach(async () => {
    system = new TicketValidationSystem('http://localhost:3000');
    
    // Mock public key
    mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;
    
    localStorage.setItem('TICKET_PUBLIC_KEY', mockPublicKey);
  });

  it('should validate valid token', () => {
    const payload = {
      ticketId: 'test-id',
      passengerId: 'pax-id',
      routeId: 'bogota-medellin',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 86400000) / 1000)
    };

    // En un test real, usarías una clave privada real para firmar
    // const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    
    // Para test, puedes usar un token pre-generado
    const token = 'eyJhbGciOiJSUzI1NiI...'; // Token válido
    
    const result = system.validateAndConsume(token, 'bogota-medellin');
    expect(result).toBe(true);
  });

  it('should reject expired token', () => {
    const expiredPayload = {
      ticketId: 'expired-id',
      expiresAt: new Date(Date.now() - 86400000).toISOString() // Ayer
    };

    const token = 'expired-token';
    const result = system.validateAndConsume(token, 'bogota-medellin');
    
    expect(result).toBe(false);
  });

  it('should reject mismatched route', () => {
    const token = 'valid-token';
    const result = system.validateAndConsume(token, 'wrong-route');
    
    expect(result).toBe(false);
  });

  it('should sync consumed tickets', async () => {
    system.consumedTickets = [
      { ticketId: 'id-1', consumedAt: new Date().toISOString() },
      { ticketId: 'id-2', consumedAt: new Date().toISOString() }
    ];

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ synced: 2, skipped: 0 })
      })
    );

    await system.syncWithServer();
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/tickets/sync',
      expect.any(Object)
    );
  });
});
```

### Ejemplo de Test de Integración

```typescript
describe('Ticket Flow Integration', () => {
  it('should complete full flow: generate -> validate -> sync', async () => {
    const API_URL = 'http://localhost:3000';
    const passengerId = '550e8400-e29b-41d4-a716-446655440000';
    const routeId = 'bogota-medellin';

    // 1. Generar tiquete
    const generateRes = await fetch(`${API_URL}/tickets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerId, routeId })
    });

    const ticket = await generateRes.json();
    expect(ticket).toHaveProperty('token');
    expect(ticket.status).toBe('active');

    // 2. Obtener clave pública
    const keyRes = await fetch(`${API_URL}/tickets/public-key`);
    const { publicKey } = await keyRes.json();
    expect(publicKey).toBeTruthy();

    // 3. Validar token (offline simulation)
    const payload = jwt.verify(ticket.token, publicKey, {
      algorithms: ['RS256']
    });
    expect(payload.ticketId).toBe(ticket.id);

    // 4. Sincronizar
    const syncRes = await fetch(`${API_URL}/tickets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketIds: [ticket.id] })
    });

    const syncResult = await syncRes.json();
    expect(syncResult.synced).toBe(1);
  });
});
```

---

## Configuración de Entorno

### Variables Necesarias

En tu archivo `.env` o archivo de configuración del frontend:

```env
# API
VITE_API_URL=http://localhost:3000
VITE_TICKETS_API_URL=http://localhost:3000/tickets

# Feature flags
VITE_ENABLE_OFFLINE_TICKETS=true
VITE_TICKET_SYNC_INTERVAL=30000  # Milisegundos
```

### Configuración en TypeScript (Vite)

```typescript
// config/tickets.ts
export const ticketConfig = {
  apiUrl: import.meta.env.VITE_TICKETS_API_URL,
  enableOffline: import.meta.env.VITE_ENABLE_OFFLINE_TICKETS === 'true',
  syncInterval: parseInt(import.meta.env.VITE_TICKET_SYNC_INTERVAL || '30000'),
  storageKeys: {
    publicKey: 'TICKET_PUBLIC_KEY',
    consumedTickets: 'consumed_tickets',
    lastSync: 'last_sync_timestamp'
  }
};
```

---

## Flujo Completo del Conductor

```
┌──────────────────────────────────────────────────────┐
│  1. Pasajero Compra Tiquete (en línea)               │
│     - Frontend genera ticket via POST /generate      │
│     - Recibe JWT + ID                                │
│     - Codifica JWT en QR                             │
│     - Imprime o muestra QR                           │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│  2. Conductor Valida Tiquete (offline)               │
│     - Descargó clave pública al inicio               │
│     - Conductor escanea QR del pasajero              │
│     - PWA extrae JWT del código                      │
│     - Valida firma RS256 SIN internet ✓              │
│     - Validar expiración                             │
│     - Marca como consumido en localStorage           │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│  3. Fin de Jornada (cuando hay internet)             │
│     - Conductor se conecta a WiFi                    │
│     - PWA detecta conexión                           │
│     - POST /sync con array de consumidos             │
│     - Backend marca como consumido en DB             │
│     - Limpia localStorage                            │
│     - Listo para siguiente jornada                   │
└──────────────────────────────────────────────────────┘
```

---

## Preguntas Frecuentes

### ¿Qué pasa si el conductor presiona "sincronizar" 2 veces?

El endpoint es **idempotente**. La segunda llamada retorna `skipped: N` en lugar de error.

```json
{
  "synced": 0,
  "failed": 0,
  "skipped": 47,
  "details": [...]
}
```

### ¿Qué pasa si no hay internet?

La validación de JWTs funciona **sin internet**. Los tiquetes se guardan localmente y se sincronizan cuando hay conexión.

### ¿Cuánto tiempo es válido un tiquete?

Por defecto **90 días**. Se configura en:
- Backend: `TICKET_EXPIRATION_DAYS=90`
- JWT claim: `exp` (expiración Unix timestamp)

### ¿Puedo validar tiquetes sin descargar la clave pública?

No. Necesitas descargar la clave pública **una sola vez** al inicializar la PWA. Se guarda en `localStorage` para uso offline.

### ¿Los tiquetes se pueden reutilizar?

No. Una vez consumido, el tiquete está marcado como "consumed" en la DB y no se puede volver a usar.

---

## Soporte y Debugging

### Logs Útiles

```typescript
function enableDebugMode(): void {
  // Mostrar toda actividad de tickets
  const originalLog = console.log;
  
  console.log = (...args) => {
    if (JSON.stringify(args).includes('ticket') || 
        JSON.stringify(args).includes('sync')) {
      originalLog(`[TICKET]`, ...args);
    }
  };
}

enableDebugMode();
```

### Verificar Almacenamiento Local

```typescript
function inspectLocalStorage(): void {
  const publicKey = localStorage.getItem('TICKET_PUBLIC_KEY');
  const consumed = JSON.parse(localStorage.getItem('consumed_tickets') || '[]');
  
  console.log('Public Key (first 50 chars):', publicKey?.substring(0, 50));
  console.log('Consumed Tickets:', consumed);
  console.log('Total Consumed:', consumed.length);
}

inspectLocalStorage();
```

### Verificar JWT Payload

```typescript
function decodeToken(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('Invalid token format');
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT Payload:', payload);
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Uso
const token = 'eyJhbGciOiJSUzI1NiI...';
decodeToken(token);
```

---

## Resumen

| Aspecto | Detalles |
|---------|----------|
| **Autenticación** | No requerida en endpoints (público) |
| **Offline** | Sí, valida JWTs sin internet |
| **Idempotencia** | Sí, /sync es seguro de llamar N veces |
| **Encriptación** | RS256 asimétrica (clave pública distribuida) |
| **Almacenamiento** | localStorage para consumo offline |
| **Sincronización** | POST /sync cuando hay internet |
| **Expiración** | Configurable, default 90 días |

---

**¿Preguntas o problemas?** Revisa la documentación backend en `ARCHITECTURE.md` o ejecuta los tests.
