import {
  addCalendarDays,
  durationMinutes,
  estimateTotal,
  formatClock,
  isColombianPhone,
  isDateInBookingWindow,
  isDateYmd,
  sliceSlotRange,
  toBookingItem,
  todayYmd,
} from './datetime';
import { AvailabilitySlot } from '../../../core/api/api.models';

describe('datetime', () => {
  it('rejects impossible calendar dates', () => {
    expect(isDateYmd('2026-02-31')).toBeFalse();
    expect(isDateYmd('2026-09-25')).toBeTrue();
  });

  it('formats Bogotá wall time from UTC', () => {
    expect(formatClock('2026-09-25T13:00:00.000Z', 'America/Bogota')).toContain('08');
    expect(formatClock('2026-09-25T14:00:00.000Z', 'America/Bogota')).toContain('09');
  });

  it('keeps booking dates inside today..+30', () => {
    const now = new Date('2026-09-01T15:00:00.000Z');
    expect(todayYmd('America/Bogota', now)).toBe('2026-09-01');
    expect(isDateInBookingWindow('2026-09-01', 'America/Bogota', now)).toBeTrue();
    expect(isDateInBookingWindow(addCalendarDays('2026-09-01', 30), 'America/Bogota', now)).toBeTrue();
    expect(isDateInBookingWindow(addCalendarDays('2026-09-01', 31), 'America/Bogota', now)).toBeFalse();
    expect(isDateInBookingWindow('2026-08-31', 'America/Bogota', now)).toBeFalse();
  });

  it('merges consecutive free slots of at least 1 hour', () => {
    const slots: AvailabilitySlot[] = [
      { start: '2026-09-25T13:00:00.000Z', end: '2026-09-25T13:30:00.000Z', status: 'free' },
      { start: '2026-09-25T13:30:00.000Z', end: '2026-09-25T14:00:00.000Z', status: 'free' },
      { start: '2026-09-25T14:00:00.000Z', end: '2026-09-25T14:30:00.000Z', status: 'booked' },
    ];
    const range = sliceSlotRange(slots, 0, 1);
    expect(range?.length).toBe(2);
    expect(durationMinutes(range![0].start, range![1].end)).toBe(60);
    expect(sliceSlotRange(slots, 0, 0)).toBeNull();
    expect(sliceSlotRange(slots, 0, 2)).toBeNull();
    expect(toBookingItem(1, range!)).toEqual({
      court_id: 1,
      starts_at: '2026-09-25T13:00:00.000Z',
      ends_at: '2026-09-25T14:00:00.000Z',
    });
    expect(estimateTotal('80000.00', 60)).toBe(80000);
  });

  it('accepts a single 60-minute free slot as a complete hour', () => {
    const hour: AvailabilitySlot[] = [
      { start: '2026-09-25T13:00:00.000Z', end: '2026-09-25T14:00:00.000Z', status: 'free' },
    ];
    const range = sliceSlotRange(hour, 0, 0);
    expect(range?.length).toBe(1);
    expect(durationMinutes(range![0].start, range![0].end)).toBe(60);
  });

  it('validates Colombian mobile numbers', () => {
    expect(isColombianPhone('3001234567')).toBeTrue();
    expect(isColombianPhone('2001234567')).toBeFalse();
  });
});
