import { Booking } from '../../core/api/api.models';
import {
  CourtFormValue,
  canCancelBooking,
  canConfirmBooking,
  courtFormError,
  nextCourtStatus,
  toBookingRow,
  toCourtWrite,
} from './admin-view';

const booking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 1,
  status: 'paid',
  guest_name: 'Ana Perez',
  guest_email: 'ana@test.com',
  guest_phone: '3001234567',
  total_amount: '80000.00',
  penalty_amount: '0.00',
  refund_amount: '0.00',
  paid_at: '2026-09-25T13:00:00.000Z',
  confirmed_at: null,
  cancelled_at: null,
  hold_expires_at: null,
  items: [
    {
      court_id: 1,
      starts_at: '2026-09-25T13:00:00.000Z',
      ends_at: '2026-09-25T14:00:00.000Z',
    },
  ],
  createdAt: '2026-09-25T12:00:00.000Z',
  updatedAt: '2026-09-25T12:00:00.000Z',
  ...overrides,
});

describe('admin-view', () => {
  it('rejects invalid court hours and slot size', () => {
    expect(
      courtFormError({
        name: 'Cancha 1',
        description: '',
        slot_minutes: 60,
        price_per_hour: 80000,
        opens_at: '22:00',
        closes_at: '08:00',
        timezone: 'America/Bogota',
        status: 'active',
      }),
    ).toContain('apertura');
    expect(
      courtFormError({
        name: 'Cancha 1',
        description: '',
        slot_minutes: 15,
        price_per_hour: 80000,
        opens_at: '08:00',
        closes_at: '22:00',
        timezone: 'America/Bogota',
        status: 'active',
      } as unknown as CourtFormValue),
    ).toContain('30 o 60');
  });

  it('builds a CourtWrite payload with seconds on clock fields', () => {
    expect(
      toCourtWrite({
        name: '  Tenis 1 ',
        description: '  ',
        slot_minutes: 30,
        price_per_hour: 50000,
        opens_at: '07:00',
        closes_at: '21:00',
        timezone: 'America/Bogota',
        status: 'active',
      }),
    ).toEqual({
      name: 'Tenis 1',
      description: undefined,
      slot_minutes: 30,
      price_per_hour: 50000,
      opens_at: '07:00:00',
      closes_at: '21:00:00',
      timezone: 'America/Bogota',
      status: 'active',
    });
  });

  it('only confirms paid bookings and blocks cancel after start', () => {
    expect(canConfirmBooking(booking({ status: 'paid' }))).toBeTrue();
    expect(canConfirmBooking(booking({ status: 'confirmed' }))).toBeFalse();
    expect(nextCourtStatus('active')).toBe('inactive');
    expect(
      canCancelBooking(
        booking({
          items: [
            {
              court_id: 1,
              starts_at: '2020-01-01T13:00:00.000Z',
              ends_at: '2020-01-01T14:00:00.000Z',
            },
          ],
        }),
        Date.parse('2026-09-01T12:00:00.000Z'),
      ),
    ).toBeFalse();
    expect(
      canCancelBooking(booking(), Date.parse('2026-09-01T12:00:00.000Z')),
    ).toBeTrue();
  });

  it('maps phone, court, duration and follow-up for the bookings grid', () => {
    const row = toBookingRow(
      booking({
        items: [
          {
            court_id: 2,
            starts_at: '2026-09-25T13:00:00.000Z',
            ends_at: '2026-09-25T14:00:00.000Z',
            court: {
              id: 2,
              name: 'Tenis 1',
              slot_minutes: 60,
              price_per_hour: '45000.00',
              opens_at: '08:00:00',
              closes_at: '22:00:00',
              timezone: 'America/Bogota',
              status: 'active',
            },
          },
        ],
      }),
      Date.parse('2026-09-01T12:00:00.000Z'),
    );
    expect(row.phone).toBe('3001234567');
    expect(row.court).toBe('Tenis 1');
    expect(row.statusLabel).toBe('Pagada');
    expect(row.durationMin).toBe(60);
    expect(row.followUp).toContain('Pagada');
    expect(row.canConfirm).toBeTrue();
  });
});
