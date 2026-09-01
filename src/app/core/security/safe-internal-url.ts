/** Rutas internas relativas. Rechaza protocol-relative y URLs absolutas (open redirect). */
export function safeInternalUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const url = value.trim();
  if (!url.startsWith('/') || url.startsWith('//') || url.includes('\\') || url.includes('://')) {
    return null;
  }

  const path = url.split('?')[0] ?? '';
  if (path === '/login') {
    return null;
  }

  return url;
}
