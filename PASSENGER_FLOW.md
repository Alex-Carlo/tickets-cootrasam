# Flujo de Compra de Tiquetes - Guía para Frontend

## 🎯 Experiencia de Usuario

```
Login → Seleccionar Ruta → Pagar → QR Generado → Descargar/Compartir
  ↓
[Todo automático, sin pasos innecesarios]
```

---

## 1. Autenticación y Obtener Passenger ID

### Login (Primero)

El usuario se autentica normalmente:

```typescript
// Auth Service (ya existente)
interface AuthUser {
  id: string;           // ← Este es el PASSENGER_ID
  email: string;
  name: string;
  phone: string;
  // otros campos...
}

async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { user, token } = await response.json();
  
  // Guardar en localStorage o sessión
  localStorage.setItem('authToken', token);
  localStorage.setItem('userId', user.id);
  
  return user;
}
```

### Obtener el Passenger ID

Una vez autenticado:

```typescript
function getPassengerId(): string {
  // El ID del usuario autenticado ES el passenger ID
  const passengerId = localStorage.getItem('userId');
  
  if (!passengerId) {
    // Si no está autenticado, redirigir a login
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  
  return passengerId;
}
```

---

## 2. Flujo de Compra Automático

### Paso 1: Seleccionar Ruta

```typescript
interface Route {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
}

async function selectRoute(routeId: string) {
  // Guardar ruta seleccionada
  sessionStorage.setItem('selectedRoute', routeId);
  
  // Ir a paso de pago
  navigateTo('/checkout');
}
```

### Paso 2: Pagar (Integración Wompi/Stripe)

```typescript
async function processPayment(routeId: string): Promise<boolean> {
  const passengerId = getPassengerId();
  
  // 1. Crear intención de pago
  const paymentResponse = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({
      routeId,
      passengerId,
      amount: 50000  // precio en centavos
    })
  });

  const payment = await paymentResponse.json();
  
  // 2. Redirigir a Wompi/Stripe
  window.location.href = payment.redirectUrl;
  
  // El usuario paga y vuelve a tu app
  // Luego: generateTicket() se ejecuta automáticamente
  return true;
}
```

### Paso 3: Pago Confirmado → Generar Tiquete

```typescript
async function generateTicketAfterPayment(routeId: string) {
  const passengerId = getPassengerId();
  
  try {
    // Llamar al backend para generar el tiquete
    const response = await fetch('/api/tickets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passengerId,
        routeId
      })
    });

    if (!response.ok) throw new Error('Failed to generate ticket');

    const ticket = await response.json();
    
    // Guardar tiquete en localStorage para offline
    const tickets = JSON.parse(localStorage.getItem('myTickets') || '[]');
    tickets.push({
      ...ticket,
      downloadedAt: new Date().toISOString()
    });
    localStorage.setItem('myTickets', JSON.stringify(tickets));
    
    // Mostrar QR
    await showTicketQR(ticket);
    
    return ticket;
  } catch (error) {
    console.error('Error generating ticket:', error);
    showErrorMessage('No se pudo generar el tiquete. Intenta nuevamente.');
  }
}
```

---

## 3. Generar y Mostrar QR

### Instalación

```bash
npm install qrcode
```

### Generar QR Automáticamente

```typescript
import QRCode from 'qrcode';

interface Ticket {
  id: string;
  token: string;
  expiresAt: string;
  routeId: string;
  passengerId: string;
}

async function showTicketQR(ticket: Ticket) {
  try {
    // Generar QR del JWT
    const qrDataUrl = await QRCode.toDataURL(ticket.token, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 400
    });

    // Mostrar en pantalla
    displayTicketModal({
      ticketId: ticket.id,
      qrImage: qrDataUrl,
      expiresAt: ticket.expiresAt,
      routeId: ticket.routeId,
      token: ticket.token
    });

  } catch (error) {
    console.error('Error generating QR:', error);
  }
}
```

### Componente React (Ejemplo)

```jsx
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export function TicketDisplay({ ticket }) {
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    // Generar QR automáticamente cuando se monta el componente
    QRCode.toDataURL(ticket.token, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400
    }).then(setQrImage);
  }, [ticket.token]);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `ticket-${ticket.id}.png`;
    link.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head><title>Tiquete</title></head>
        <body style="text-align: center; padding: 20px;">
          <h1>Tu Tiquete</h1>
          <p>ID: ${ticket.id}</p>
          <p>Válido hasta: ${new Date(ticket.expiresAt).toLocaleDateString()}</p>
          <img src="${qrImage}" style="width: 400px; height: 400px;">
          <p>Muestra este código QR al conductor</p>
        </body>
      </html>
    `);
    printWindow.print();
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        const blob = await fetch(qrImage).then(r => r.blob());
        const file = new File([blob], `ticket-${ticket.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Mi Tiquete',
          text: `Tiquete válido hasta ${new Date(ticket.expiresAt).toLocaleDateString()}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="ticket-modal">
      <div className="ticket-card">
        <h2>✓ Tiquete Generado</h2>
        
        <div className="ticket-info">
          <p><strong>ID:</strong> {ticket.id}</p>
          <p><strong>Ruta:</strong> {ticket.routeId}</p>
          <p><strong>Válido hasta:</strong> {new Date(ticket.expiresAt).toLocaleDateString()}</p>
        </div>

        <div className="qr-container">
          {qrImage && (
            <img src={qrImage} alt="QR Code" className="qr-image" />
          )}
        </div>

        <div className="actions">
          <button onClick={downloadQR} className="btn-primary">
            📥 Descargar QR
          </button>
          <button onClick={printQR} className="btn-secondary">
            🖨️ Imprimir
          </button>
          {navigator.share && (
            <button onClick={shareQR} className="btn-secondary">
              📤 Compartir
            </button>
          )}
        </div>

        <p className="hint">
          📱 Muestra este QR al conductor para validar tu tiquete
        </p>
      </div>
    </div>
  );
}
```

---

## 4. Flujo Completo (Todo Automatizado)

```typescript
/**
 * FLUJO COMPLETO: Login → Compra → QR
 * Totalmente automático, sin que el usuario tenga que hacer nada extra
 */

async function completeTicketPurchaseFlow(routeId: string) {
  try {
    // 1. Verificar autenticación
    const passengerId = getPassengerId();
    if (!passengerId) {
      navigateTo('/login');
      return;
    }

    // 2. Procesar pago (redirige a Wompi, vuelve aquí)
    await processPayment(routeId);

    // 3. Generar tiquete automáticamente
    const ticket = await generateTicketAfterPayment(routeId);

    // 4. Mostrar QR automáticamente
    // (el componente TicketDisplay lo muestra en pantalla)

  } catch (error) {
    console.error('Error in ticket purchase:', error);
    showErrorMessage('Algo salió mal. Por favor intenta nuevamente.');
  }
}
```

---

## 5. Guardar Tiquetes Locales (Para Offline)

```typescript
interface LocalTicket {
  id: string;
  token: string;
  qrImage: string;  // base64
  expiresAt: string;
  routeId: string;
  status: 'active' | 'used' | 'expired';
  downloadedAt: string;
}

class TicketManager {
  private storageKey = 'my-tickets';

  // Guardar nuevo tiquete
  saveTicket(ticket: Ticket, qrImage: string) {
    const tickets = this.getAllTickets();
    
    tickets.push({
      id: ticket.id,
      token: ticket.token,
      qrImage,
      expiresAt: ticket.expiresAt,
      routeId: ticket.routeId,
      status: 'active',
      downloadedAt: new Date().toISOString()
    });

    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
  }

  // Obtener todos los tiquetes
  getAllTickets(): LocalTicket[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Obtener tiquetes activos
  getActiveTickets(): LocalTicket[] {
    return this.getAllTickets()
      .filter(t => t.status === 'active')
      .filter(t => new Date(t.expiresAt) > new Date());
  }

  // Marcar como usado
  markAsUsed(ticketId: string) {
    const tickets = this.getAllTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (ticket) {
      ticket.status = 'used';
      localStorage.setItem(this.storageKey, JSON.stringify(tickets));
    }
  }
}
```

---

## 6. Página de "Mis Tiquetes"

```jsx
import { TicketManager } from './ticketManager';

export function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const manager = new TicketManager();
    const activeTickets = manager.getActiveTickets();
    setTickets(activeTickets);
  }, []);

  return (
    <div className="my-tickets">
      <h1>Mis Tiquetes</h1>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <p>No tienes tiquetes activos</p>
          <button onClick={() => navigateTo('/buy-ticket')}>
            Comprar Tiquete
          </button>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card-compact">
              <div className="ticket-info">
                <h3>{ticket.routeId}</h3>
                <p>Válido hasta: {new Date(ticket.expiresAt).toLocaleDateString()}</p>
              </div>

              <div className="ticket-actions">
                <button onClick={() => showQRModal(ticket.qrImage)}>
                  Ver QR
                </button>
                <button onClick={() => downloadTicketQR(ticket)}>
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Integración con PWA del Conductor

Cuando el conductor escanea el QR:

```typescript
// PWA del conductor
async function validateScannedTicket(scannedJWT: string) {
  try {
    // 1. Obtener clave pública (ya descargada en setup)
    const publicKey = localStorage.getItem('TICKET_PUBLIC_KEY');

    // 2. Validar JWT offline
    const payload = jwt.verify(scannedJWT, publicKey, {
      algorithms: ['RS256'],
      issuer: 'tickets-service'
    });

    // 3. Verificar expiración
    if (new Date(payload.expiresAt) < new Date()) {
      showError('Tiquete expirado');
      return false;
    }

    // 4. Mostrar info del pasajero
    showTicketInfo({
      passengerId: payload.passengerId,
      routeId: payload.routeId,
      expiresAt: payload.expiresAt
    });

    // 5. Guardar como consumido
    markTicketAsConsumed(payload.ticketId);

    showSuccess('✓ Tiquete válido');
    return true;

  } catch (error) {
    showError('Tiquete inválido');
    return false;
  }
}
```

---

## 8. Checklist de Implementación

### Pasajero (Comprador)

- [ ] Login automático con obtención de passenger ID
- [ ] Seleccionar ruta
- [ ] Integración con Wompi/Stripe para pago
- [ ] Generar tiquete automáticamente después del pago
- [ ] Generar QR automáticamente
- [ ] Mostrar QR en pantalla
- [ ] Botones: Descargar, Imprimir, Compartir
- [ ] Guardar tiquete en localStorage (offline)
- [ ] Página "Mis Tiquetes"
- [ ] Validación de expiración

### Conductor (Validador)

- [ ] Descargar clave pública al inicializar
- [ ] Lector de QR (cámara)
- [ ] Validar JWT offline (sin internet)
- [ ] Mostrar info del tiquete validado
- [ ] Guardar consumo en localStorage
- [ ] Sincronizar cuando hay internet (POST /api/tickets/sync)

---

## 9. URLs Correctas

```typescript
// Asegúrate de usar /api/tickets/, NO /tickets/

const API_BASE = 'http://localhost:3000/api';

// Endpoints
const ENDPOINTS = {
  GENERATE_TICKET: `${API_BASE}/tickets/generate`,
  PUBLIC_KEY: `${API_BASE}/tickets/public-key`,
  SYNC_TICKETS: `${API_BASE}/tickets/sync`,
  GET_PASSENGER_TICKETS: (id) => `${API_BASE}/tickets/passenger/${id}`,
};
```

---

## 10. Ejemplo Completo: Página de Checkout

```jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { TicketDisplay } from '../components/TicketDisplay';

export function CheckoutPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Cuando el usuario viene de Wompi (pago exitoso)
  useEffect(() => {
    const processPaymentAndGenerateTicket = async () => {
      setLoading(true);

      try {
        const passengerId = localStorage.getItem('userId');
        if (!passengerId) {
          navigate('/login');
          return;
        }

        // Generar tiquete
        const response = await fetch('/api/tickets/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passengerId, routeId })
        });

        if (!response.ok) throw new Error('Failed to generate ticket');

        const generatedTicket = await response.json();
        setTicket(generatedTicket);

        // Guardar en localStorage
        const tickets = JSON.parse(localStorage.getItem('myTickets') || '[]');
        tickets.push(generatedTicket);
        localStorage.setItem('myTickets', JSON.stringify(tickets));

      } catch (err) {
        setError('No se pudo generar tu tiquete. Intenta nuevamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    processPaymentAndGenerateTicket();
  }, [routeId, navigate]);

  if (loading) return <div>Generando tu tiquete...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!ticket) return <div>Cargando...</div>;

  return <TicketDisplay ticket={ticket} />;
}
```

---

## Resumen

✅ **Completamente automático:**
1. Login → obtiene passenger ID
2. Compra → paga con Wompi
3. QR → generado y mostrado automáticamente
4. Descarga → botones listos
5. Offline → tiquete guardado localmente

✅ **Experiencia única:**
- Sin pasos innecesarios
- Todo en flujo continuo
- Múltiples formas de compartir (descargar, imprimir, compartir)
- Acceso a tiquetes previos

✅ **Listo para conductor:**
- Valida QR offline
- Marca como consumido
- Sincroniza cuando hay internet
