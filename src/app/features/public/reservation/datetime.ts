import { AvailabilitySlot, BookingItemInput } from '../../../core/api/api.models';

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
export const MAX_ADVANCE_DAYS = 30;
export const MIN_DURATION_MINUTES = 60;

export function isDateYmd(value: string): boolean {
  const match = YMD.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

export function ymdInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function todayYmd(timeZone: string, now = new Date()): string {
  return ymdInZone(now, timeZone);
}

export function addCalendarDays(ymd: string, days: number): string {
  if (!isDateYmd(ymd)) {
    throw new Error('Fecha inválida');
  }
  const [year, month, day] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
}

export function isDateInBookingWindow(ymd: string, timeZone: string, now = new Date()): boolean {
  if (!isDateYmd(ymd)) {
    return false;
  }
  const today = todayYmd(timeZone, now);
  const max = addCalendarDays(today, MAX_ADVANCE_DAYS);
  return ymd >= today && ymd <= max;
}

export function formatClock(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(isoUtc));
}

export function durationMinutes(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000;
}

export function hoursFromMinutes(minutes: number): number {
  return minutes / 60;
}

export function estimateTotal(pricePerHour: string, minutes: number): number {
  const hourly = Number(pricePerHour);
  if (!Number.isFinite(hourly) || minutes <= 0) {
    return 0;
  }
  return Math.round(((hourly * minutes) / 60) * 100) / 100;
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sliceSlotRange(
  slots: readonly AvailabilitySlot[],
  indexA: number,
  indexB: number,
): AvailabilitySlot[] | null {
  if (indexA < 0 || indexB < 0 || indexA >= slots.length || indexB >= slots.length) {
    return null;
  }

  const from = Math.min(indexA, indexB);
  const to = Math.max(indexA, indexB);
  const selected = slots.slice(from, to + 1);

  if (selected.some((slot) => slot.status !== 'free')) {
    return null;
  }

  for (let i = 0; i < selected.length - 1; i += 1) {
    if (new Date(selected[i].end).getTime() !== new Date(selected[i + 1].start).getTime()) {
      return null;
    }
  }

  const minutes = durationMinutes(selected[0].start, selected[selected.length - 1].end);
  if (minutes < MIN_DURATION_MINUTES) {
    return null;
  }

  return selected;
}

export function toBookingItem(courtId: number, range: readonly AvailabilitySlot[]): BookingItemInput {
  return {
    court_id: courtId,
    starts_at: range[0].start,
    ends_at: range[range.length - 1].end,
  };
}

export function isColombianPhone(value: string): boolean {
  return /^3\d{9}$/.test(value.trim());
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function parseYmd(ymd: string): { year: number; month: number; day: number } {
  if (!isDateYmd(ymd)) {
    throw new Error('Fecha inválida');
  }
  const [year, month, day] = ymd.split('-').map(Number);
  return { year, month, day };
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const utc = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1 };
}

export function monthOverlapsWindow(
  year: number,
  month: number,
  minYmd: string,
  maxYmd: string,
): boolean {
  const start = formatYmd(year, month, 1);
  const end = formatYmd(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
  return start <= maxYmd && end >= minYmd;
}

export type CalendarCell = {
  ymd: string;
  day: number;
  inMonth: boolean;
  selectable: boolean;
};

export function monthCells(
  year: number,
  month: number,
  minYmd: string,
  maxYmd: string,
): CalendarCell[] {
  const first = formatYmd(year, month, 1);
  const mondayOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const start = addCalendarDays(first, -mondayOffset);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const ymd = addCalendarDays(start, i);
    const parts = parseYmd(ymd);
    cells.push({
      ymd,
      day: parts.day,
      inMonth: parts.year === year && parts.month === month,
      selectable: ymd >= minYmd && ymd <= maxYmd,
    });
  }

  return cells;
}

export function formatMonthTitle(year: number, month: number): string {
  const label = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatFriendlyDate(ymd: string): string {
  const { year, month, day } = parseYmd(ymd);
  const label = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
