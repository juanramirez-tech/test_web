import { AppRole } from '../api/api.models';

export interface JwtPayload {
  id: number;
  email: string;
  role: AppRole | string;
  iat?: number;
  exp?: number;
}

export interface AuthSession {
  token: string;
  userId: number;
  email: string;
  role: AppRole;
  expiresAt: number;
}

function decodeBase64Url(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (typeof payload.id !== 'number' || typeof payload.email !== 'string') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isJwtExpired(payload: JwtPayload, skewSeconds = 30): boolean {
  if (typeof payload.exp !== 'number') {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export function toAuthSession(token: string): AuthSession | null {
  const payload = parseJwtPayload(token);
  if (!payload || isJwtExpired(payload)) {
    return null;
  }

  const role = payload.role === 'admin' || payload.role === 'user' ? payload.role : null;
  if (!role || typeof payload.exp !== 'number') {
    return null;
  }

  return {
    token,
    userId: payload.id,
    email: payload.email,
    role,
    expiresAt: payload.exp * 1000,
  };
}
