import { environment } from '../../../environments/environment';

function pathnameOf(url: string): string | null {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname;
    }
    return url.split('?')[0] ?? null;
  } catch {
    return null;
  }
}

function isAllowedOrigin(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const base = environment.apiBaseUrl;
    if (base) {
      return parsed.origin === new URL(base).origin;
    }
    return typeof location !== 'undefined' && parsed.origin === location.origin;
  } catch {
    return false;
  }
}

export function isOwnApiUrl(url: string): boolean {
  if (!isAllowedOrigin(url)) {
    return false;
  }

  const path = pathnameOf(url);
  if (!path) {
    return false;
  }

  return path === '/login' || path === '/health' || path.startsWith('/api/');
}

export function isLoginApiUrl(url: string): boolean {
  return pathnameOf(url) === '/login';
}
