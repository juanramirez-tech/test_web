/**
 * Bloquea iframes cross-origin. Same-origin (p. ej. Karma) se permite.
 * El control definitivo son cabeceras del hosting (`X-Frame-Options`, CSP).
 */
export function blockClickjacking(): void {
  try {
    if (window.top && window.top.origin !== window.self.origin) {
      document.documentElement.replaceChildren();
    }
  } catch {
    document.documentElement.replaceChildren();
  }
}
