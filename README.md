# Reserva de canchas

Frontend Angular 20 + Tailwind v4: reserva pública sin registro y panel admin con JWT.

El backend vive en `test_back` (`http://localhost:3000`). En desarrollo, `ng serve` proxea `/api`, `/health` y `POST /login` hacia esa API.

## Qué cubre

**Público**

| Ruta | Qué hace |
|---|---|
| `/` | Reserva en una página: cancha → día → horario → datos → pago simulado |
| `/reservar` | Redirige a `/` |
| `/login` | Sesión de administrador |

El código de acceso no se muestra en la UI ni va en la URL. El panel admin tampoco lo enseña.

**Admin** (`/admin`, solo JWT con `role=admin`)

| Ruta | Qué hace |
|---|---|
| `/admin` | Panel: conteos y reservas recientes |
| `/admin/courts` | Inventario de canchas (alta/edición en modal, activar/desactivar, borrar) |
| `/admin/bookings` | Reservas en AG Grid; detalle, confirmar y cancelar en modal |
| `/admin/bookings/:id` | Redirige a `/admin/bookings?reserva=:id` |

Los guards solo evitan ruido en la UI. Quien autoriza es la API.

## Arranque

1. API en `http://localhost:3000`.
2. Copia `.env.example` → `.env.local`. `AUTH_GATE` debe ser el mismo `AUTH` del backend (el proxy lo envía en `POST /login`). No lo pongas en `src/environments`.
3. `npm start` → [http://localhost:4200](http://localhost:4200).

Credenciales de admin: las del seed del backend.

## Convenciones

- Páginas y stores usan `PublicCourtsApi`, `GuestBookingsApi`, `AuthApi`, `AdminCourtsApi`, `AdminBookingsApi`. No `HttpClient` directo en features.
- `GuestAccess` + interceptor: cabecera `X-Access-Code` solo si el cliente pide `useGuestAccess`.
- Borrar una cancha con reservas asociadas responde 422 (sin cascade).
- `npm run sync:openapi` si cambia el contrato.

## Tests, lint y build

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run lint
npm run build
```
