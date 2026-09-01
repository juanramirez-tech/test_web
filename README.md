# test_admin

Sitio público de reservas + panel admin (Angular 20).

## Arranque

1. API en `http://localhost:3000`
2. `.env.example` → `.env.local` (`AUTH_GATE` = `AUTH` del backend)
3. `npm start` → [http://localhost:4200](http://localhost:4200)

## Estructura de rutas

| Ruta | Área |
|---|---|
| `/` | Público: inicio |
| `/reservar` | Público: checkout |
| `/mi-reserva` | Público: reserva del invitado |
| `/login` | Admin: sesión |
| `/admin` | Admin: panel |

## Core (listo, sin UI)

- `PublicCourtsApi`, `GuestBookingsApi`, `GuestAccess` (`X-Access-Code`, no va en la URL)
- `AuthApi` / `AuthService`, `AdminCourtsApi`, `AdminBookingsApi`
- Proxy local inyecta `auth` en `POST /login`

`npm run sync:openapi` tras cambios de contrato.
