import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'ta.guest-access';

@Injectable({ providedIn: 'root' })
export class GuestAccess {
  private readonly stored = signal<string | null>(this.read());

  readonly code = this.stored.asReadonly();
  readonly hasCode = () => Boolean(this.stored());

  save(raw: string): boolean {
    const code = raw.trim();
    if (!isAccessCode(code)) {
      return false;
    }
    this.stored.set(code);
    this.writeRaw(code);
    return true;
  }

  clear(): void {
    this.stored.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage bloqueado
    }
  }

  masked(): string | null {
    const code = this.stored();
    if (!code || code.length < 8) {
      return code;
    }
    return `${code.slice(0, 4)}…${code.slice(-4)}`;
  }

  private read(): string | null {
    try {
      const value = sessionStorage.getItem(STORAGE_KEY);
      return value && isAccessCode(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeRaw(code: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, code);
    } catch {
      // queda en memoria
    }
  }
}

export function isAccessCode(value: string): boolean {
  return /^[A-Za-z0-9]{16,64}$/.test(value);
}
