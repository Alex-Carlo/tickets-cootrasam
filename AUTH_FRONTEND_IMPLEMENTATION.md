# Implementación de Login y Registro - Frontend

## 🔗 Endpoints Backend

```
POST   /api/auth/register      - Registrar nuevo usuario
POST   /api/auth/login         - Iniciar sesión
POST   /api/auth/refresh       - Refrescar token
PATCH  /api/auth/password      - Cambiar contraseña (requiere autenticación)
```

---

## 1. Servicio de Autenticación

```typescript
// src/services/auth.service.ts

import { Role } from '@/common/enums/role.enum';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const API_BASE = 'http://localhost:3000/api';
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'currentUser',
  USER_ROLE: 'userRole',
};

class AuthService {
  // ============ REGISTRO ============
  async register(data: RegisterFormData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result: AuthResponse = await response.json();
      this.saveAuth(result);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // ============ LOGIN ============
  async login(data: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result: AuthResponse = await response.json();
      this.saveAuth(result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // ============ REFRESCAR TOKEN ============
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        throw new Error('Token refresh failed');
      }

      const result: AuthResponse = await response.json();
      this.saveAuth(result);
      return result;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  // ============ CAMBIAR CONTRASEÑA ============
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // ============ GUARDAR AUTENTICACIÓN ============
  private saveAuth(result: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
  }

  // ============ OBTENER USUARIO ACTUAL ============
  getCurrentUser(): (AuthUser & { role?: string }) | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    if (!userJson) return null;

    const user = JSON.parse(userJson);
    return { ...user, role };
  }

  // ============ OBTENER TOKENS ============
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // ============ VALIDAR AUTENTICACIÓN ============
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // ============ VALIDAR ROLES ============
  isPassenger(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'passenger';
  }

  isConductor(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'conductor';
  }

  getPassengerId(): string {
    const user = this.getCurrentUser();
    
    if (!user?.id) {
      throw new Error('Not authenticated');
    }

    if (user.role !== 'passenger') {
      throw new Error('Only passengers can buy tickets');
    }

    return user.id;
  }

  // ============ CERRAR SESIÓN ============
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  }
}

export const authService = new AuthService();
```

---

## 2. Componente de Login

```jsx
// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validación básica
      if (!formData.email || !formData.password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Llamar al servicio
      const result = await authService.login(formData);

      // Redirigir según el rol
      if (result.user.role === 'passenger') {
        navigate('/passenger/dashboard');
      } else if (result.user.role === 'conductor') {
        navigate('/conductor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <a href="/register">Crear cuenta</a></p>
          <p><a href="/forgot-password">¿Olvidaste tu contraseña?</a></p>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Componente de Registro

```jsx
// src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      throw new Error('Todos los campos son requeridos');
    }

    if (formData.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Email inválido');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      validateForm();

      // No enviar confirmPassword al backend
      const { confirmPassword, ...registerData } = formData;

      await authService.register(registerData);

      // Redirigir a dashboard
      navigate('/passenger/dashboard');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Crear Cuenta</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Nombre</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Juan"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Apellido</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Pérez"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <small>Mínimo 8 caracteres</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a></p>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Componente Protegido - ProtectedRoute

```typescript
// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'passenger' | 'conductor' | 'admin';
}

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  // No autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin rol requerido
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 5. Configuración de Rutas

```typescript
// src/App.tsx o src/router/index.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PassengerDashboard } from '@/pages/passenger/Dashboard';
import { ConductorDashboard } from '@/pages/conductor/Dashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Passenger Routes */}
        <Route
          path="/passenger/dashboard"
          element={
            <ProtectedRoute requiredRole="passenger">
              <PassengerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger/tickets"
          element={
            <ProtectedRoute requiredRole="passenger">
              <PassengerTicketsPage />
            </ProtectedRoute>
          }
        />

        {/* Conductor Routes */}
        <Route
          path="/conductor/dashboard"
          element={
            <ProtectedRoute requiredRole="conductor">
              <ConductorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor/validate"
          element={
            <ProtectedRoute requiredRole="conductor">
              <ValidateQRPage />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 6. Hook para Autenticación

```typescript
// src/hooks/useAuth.ts

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, AuthUser } from '@/services/auth.service';

interface UseAuthReturn {
  user: (AuthUser & { role?: string }) | null;
  isAuthenticated: boolean;
  isPassenger: boolean;
  isConductor: boolean;
  loading: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [user, setUser] = useState<(AuthUser & { role?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Refrescar token si está próximo a expirar
    if (currentUser && authService.getAccessToken()) {
      const refreshInterval = setInterval(async () => {
        try {
          await authService.refreshToken();
          setUser(authService.getCurrentUser());
        } catch (error) {
          console.error('Token refresh failed:', error);
          authService.logout();
          navigate('/login');
        }
      }, 5 * 60 * 1000); // Cada 5 minutos

      return () => clearInterval(refreshInterval);
    }
  }, [navigate]);

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  return {
    user,
    isAuthenticated: !!user,
    isPassenger: authService.isPassenger(),
    isConductor: authService.isConductor(),
    loading,
    logout,
  };
}
```

---

## 7. Uso del Hook en Componentes

```jsx
// src/components/Navbar.tsx

import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      {isAuthenticated && user ? (
        <>
          <span>Bienvenido, {user.id}</span>
          <span className="badge">{user.role}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </>
      ) : (
        <>
          <a href="/login">Iniciar Sesión</a>
          <a href="/register">Registrarse</a>
        </>
      )}
    </nav>
  );
}
```

---

## 8. Manejo de Errores Comunes

```typescript
// src/services/error-handler.ts

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleAuthError(error: any): string {
  if (error.message.includes('Email already')) {
    return 'Este email ya está registrado';
  }
  
  if (error.message.includes('Invalid credentials')) {
    return 'Email o contraseña incorrectos';
  }
  
  if (error.message.includes('Password')) {
    return 'Error con la contraseña';
  }

  return error.message || 'Error de autenticación';
}
```

---

## 9. Estilos CSS (Ejemplo)

```css
/* src/pages/LoginPage.css */

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #c33;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
```

---

## 10. Checklist de Implementación

- [ ] Crear `auth.service.ts` con login/register
- [ ] Crear componente `LoginPage.tsx`
- [ ] Crear componente `RegisterPage.tsx`
- [ ] Crear componente `ProtectedRoute.tsx`
- [ ] Crear hook `useAuth.ts`
- [ ] Configurar rutas en `App.tsx` o `router/index.tsx`
- [ ] Crear `error-handler.ts`
- [ ] Agregar estilos CSS
- [ ] Probar login con usuario cliente
- [ ] Probar login con usuario conductor
- [ ] Verificar que redirige al dashboard correcto según rol

---

## 11. Variables de Entorno

```env
# .env.local

VITE_API_URL=http://localhost:3000/api
```

O si usas un archivo `.env`:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## 12. Flujo Completo

```
1. Usuario llega a /login
   ↓
2. Ingresa email y contraseña
   ↓
3. authService.login() → POST /api/auth/login
   ↓
4. Backend retorna: { accessToken, refreshToken, user }
   ↓
5. Guardar en localStorage
   ↓
6. Redirigir según rol:
   - role: 'passenger' → /passenger/dashboard
   - role: 'conductor' → /conductor/dashboard
   ↓
7. ProtectedRoute valida en cada ruta
   ↓
8. Token se refresca cada 5 minutos
   ↓
9. Logout borra tokens y redirige a /login
```

---

## 🎯 Credenciales de Prueba

```
CLIENTE (Pasajero):
Email: pasajero@example.com
Password: (la que configuraste en Supabase)

CONDUCTOR:
Email: conductor@example.com
Password: (la que configuraste en Supabase)
```

---

## ✅ Listo para usar

Copia y pega todo el código anterior en tu proyecto React. Asegúrate de:

1. ✅ Tener instaladas las dependencias: `react-router-dom`
2. ✅ La URL del API correcta en `auth.service.ts`
3. ✅ Los usuarios creados en Supabase
4. ✅ Los roles asignados correctamente

¡Listo para empezar! 🚀
