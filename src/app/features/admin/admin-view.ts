import { Booking, BookingStatus, CourtStatus, CourtWrite, SlotMinutes } from '../../core/api/api.models';
import { ApiError } from '../../core/api/api-error';
import { durationMinutes, formatClock, formatCop } from '../public/reservation/datetime';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagada',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending_payment',
  'paid',
  'confirmed',
  'cancelled',
  'expired',
];

export function courtStatusLabel(status: CourtStatus): string {
  return status === 'active' ? 'Activa' : 'Inactiva';
}

export function nextCourtStatus(status: CourtStatus): CourtStatus {
  return status === 'active' ? 'inactive' : 'active';
}

export function apiMessage(error: unknown, fallback = 'No se pudo completar la operación.'): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function canConfirmBooking(booking: Booking): boolean {
  return booking.status === 'paid';
}

export function canCancelBooking(booking: Booking, now = Date.now()): boolean {
  if (booking.status === 'cancelled' || booking.status === 'expired') {
    return false;
  }
  const starts = booking.items
    .map((item) => new Date(item.starts_at).getTime())
    .filter((value) => Number.isFinite(value));
  if (starts.length === 0) {
    return true;
  }
  return Math.min(...starts) > now;
}

export function formatAdminDateTime(isoUtc: string, timeZone = 'America/Bogota'): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoUtc));
}

export function formatAdminDate(isoUtc: string, timeZone = 'America/Bogota'): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    dateStyle: 'medium',
  }).format(new Date(isoUtc));
}

export type BookingRow = {
  id: number;
  guest: string;
  email: string;
  phone: string;
  status: BookingStatus;
  statusLabel: string;
  court: string;
  playDate: Date | null;
  playDateLabel: string;
  slot: string;
  durationMin: number;
  total: number;
  penalty: number;
  refund: number;
  followUp: string;
  created: Date;
  canConfirm: boolean;
  canCancel: boolean;
};

export function bookingPlayTimezone(booking: Booking): string {
  return booking.items[0]?.court?.timezone ?? 'America/Bogota';
}

export function toBookingRow(booking: Booking, now = Date.now()): BookingRow {
  const tz = bookingPlayTimezone(booking);
  const first = booking.items[0];
  const last = booking.items[booking.items.length - 1];
  const courts = [
    ...new Set(
      booking.items.map((item) => item.court?.name ?? (item.court_id ? `Cancha ${item.court_id}` : '—')),
    ),
  ];
  const durationMin = booking.items.reduce(
    (sum, item) => sum + Math.max(0, durationMinutes(item.starts_at, item.ends_at)),
    0,
  );
  const playDate = first ? new Date(first.starts_at) : null;
  const slot = first
    ? `${formatClock(first.starts_at, tz)} – ${formatClock((last ?? first).ends_at, tz)}`
    : '—';

  return {
    id: booking.id,
    guest: booking.guest_name,
    email: booking.guest_email,
    phone: booking.guest_phone,
    status: booking.status,
    statusLabel: BOOKING_STATUS_LABEL[booking.status],
    court: courts.filter((name) => name !== '—').join(' · ') || '—',
    playDate,
    playDateLabel: first ? formatAdminDate(first.starts_at, tz) : '—',
    slot: booking.items.length > 1 ? `${slot} · ${booking.items.length} bloques` : slot,
    durationMin,
    total: Number(booking.total_amount),
    penalty: Number(booking.penalty_amount),
    refund: Number(booking.refund_amount),
    followUp: bookingFollowUp(booking, tz),
    created: new Date(booking.createdAt),
    canConfirm: canConfirmBooking(booking),
    canCancel: canCancelBooking(booking, now),
  };
}

export function bookingFollowUp(booking: Booking, timeZone = 'America/Bogota'): string {
  if (booking.status === 'pending_payment' && booking.hold_expires_at) {
    return `Hold ${formatAdminDateTime(booking.hold_expires_at, timeZone)}`;
  }
  if (booking.status === 'paid' && booking.paid_at) {
    return `Pagada ${formatAdminDateTime(booking.paid_at, timeZone)}`;
  }
  if (booking.status === 'confirmed' && booking.confirmed_at) {
    return `Confirmada ${formatAdminDateTime(booking.confirmed_at, timeZone)}`;
  }
  if (booking.status === 'cancelled' && booking.cancelled_at) {
    const refund = Number(booking.refund_amount);
    const extra = refund > 0 ? ` · reembolso ${formatCop(refund)}` : '';
    return `Cancelada ${formatAdminDateTime(booking.cancelled_at, timeZone)}${extra}`;
  }
  if (booking.status === 'expired') {
    return 'Hold vencido';
  }
  return '—';
}

export type CourtFormValue = {
  name: string;
  description: string;
  slot_minutes: SlotMinutes;
  price_per_hour: number;
  opens_at: string;
  closes_at: string;
  timezone: string;
  status: CourtStatus;
};

export function clockInput(value: string): string {
  return value.slice(0, 5);
}

export function normalizeClock(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

export function courtFormError(value: CourtFormValue): string | null {
  const name = value.name.trim();
  if (!name) {
    return 'El nombre es requerido.';
  }
  if (name.length > 128) {
    return 'El nombre no puede superar 128 caracteres.';
  }
  if (value.description.trim().length > 512) {
    return 'La descripción no puede superar 512 caracteres.';
  }
  if (value.slot_minutes !== 30 && value.slot_minutes !== 60) {
    return 'Los bloques deben ser de 30 o 60 minutos.';
  }
  if (!Number.isFinite(value.price_per_hour) || value.price_per_hour < 0) {
    return 'El precio por hora debe ser un número mayor o igual a 0.';
  }
  const opens = normalizeClock(value.opens_at);
  const closes = normalizeClock(value.closes_at);
  if (!/^\d{2}:\d{2}:\d{2}$/.test(opens) || !/^\d{2}:\d{2}:\d{2}$/.test(closes)) {
    return 'El horario debe tener formato HH:mm.';
  }
  if (opens >= closes) {
    return 'La hora de apertura debe ser anterior al cierre.';
  }
  if (!value.timezone.trim() || value.timezone.trim().length > 64) {
    return 'La zona horaria es requerida.';
  }
  if (value.status !== 'active' && value.status !== 'inactive') {
    return 'El estado debe ser activa o inactiva.';
  }
  return null;
}

export function toCourtWrite(value: CourtFormValue): CourtWrite {
  const description = value.description.trim();
  return {
    name: value.name.trim(),
    description: description || undefined,
    slot_minutes: value.slot_minutes,
    price_per_hour: value.price_per_hour,
    opens_at: normalizeClock(value.opens_at),
    closes_at: normalizeClock(value.closes_at),
    timezone: value.timezone.trim() || 'America/Bogota',
    status: value.status,
  };
}

export function emptyCourtForm(): CourtFormValue {
  return {
    name: '',
    description: '',
    slot_minutes: 60,
    price_per_hour: 0,
    opens_at: '08:00',
    closes_at: '22:00',
    timezone: 'America/Bogota',
    status: 'active',
  };
}
