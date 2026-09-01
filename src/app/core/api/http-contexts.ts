import { HttpContextToken } from '@angular/common/http';

/** Omite Authorization Bearer (login, health, recursos públicos). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** Envía `X-Access-Code` (reservas de invitado). Nunca va en la URL. */
export const USE_GUEST_ACCESS = new HttpContextToken<boolean>(() => false);
