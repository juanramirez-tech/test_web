import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GuestAccess } from '../../../core/guest/guest-access';
import { apiErrorInterceptor } from '../../../core/interceptors/api-error.interceptor';
import { PAYMENT_SIMULATION_MS, ReservationStore } from './reservation.store';
import { AvailabilitySlot, Booking, Court } from '../../../core/api/api.models';

const court: Court = {
  id: 1,
  name: 'Cancha 1',
  slot_minutes: 60,
  price_per_hour: '80000.00',
  opens_at: '08:00:00',
  closes_at: '22:00:00',
  timezone: 'America/Bogota',
  status: 'active',
};

const slots: AvailabilitySlot[] = [
  { start: '2026-09-25T13:00:00.000Z', end: '2026-09-25T14:00:00.000Z', status: 'free' },
  { start: '2026-09-25T14:00:00.000Z', end: '2026-09-25T15:00:00.000Z', status: 'free' },
];

const paidBooking: Booking = {
  id: 9,
  status: 'paid',
  guest_name: 'Ana Perez',
  guest_email: 'ana@test.com',
  guest_phone: '3001234567',
  total_amount: '80000.00',
  penalty_amount: '0.00',
  refund_amount: '0.00',
  paid_at: '2026-09-25T13:00:00.000Z',
  confirmed_at: '2026-09-25T13:00:00.000Z',
  cancelled_at: null,
  hold_expires_at: null,
  items: [],
  createdAt: '2026-09-25T13:00:00.000Z',
  updatedAt: '2026-09-25T13:00:00.000Z',
};

describe('ReservationStore', () => {
  let store: ReservationStore;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ReservationStore,
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        GuestAccess,
      ],
    });
    store = TestBed.inject(ReservationStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('completes a 60-minute slot on the first click', () => {
    store.slots.set(slots);
    store.pickSlot(0);
    expect(store.rangeStart()).toBe(0);
    expect(store.rangeEnd()).toBe(0);
    expect(store.selectedRange()?.length).toBe(1);
    expect(store.selectedMinutes()).toBe(60);
  });

  it('needs a second click when slots are 30 minutes', () => {
    store.slots.set([
      { start: '2026-09-25T13:00:00.000Z', end: '2026-09-25T13:30:00.000Z', status: 'free' },
      { start: '2026-09-25T13:30:00.000Z', end: '2026-09-25T14:00:00.000Z', status: 'free' },
    ]);
    store.pickSlot(0);
    expect(store.rangeEnd()).toBeNull();
    expect(store.selectedRange()).toBeNull();
    store.pickSlot(1);
    expect(store.rangeEnd()).toBe(1);
    expect(store.selectedMinutes()).toBe(60);
  });

  it('shows paying then confirms without keeping an access code', fakeAsync(() => {
    store.courts.set([court]);
    store.courtId.set(1);
    store.date.set('2026-09-25');
    store.slots.set(slots);
    store.rangeStart.set(0);
    store.rangeEnd.set(0);
    store.guestName.set('Ana Perez');
    store.guestEmail.set('ana@test.com');
    store.guestPhone.set('3001234567');

    store.submit();
    expect(store.paying()).toBeTrue();
    expect(store.step()).toBe(5);
    expect(store.booking()).toBeNull();

    http.expectOne('/api/v1/bookings').flush(paidBooking);
    expect(store.booking()).toBeNull();
    tick(PAYMENT_SIMULATION_MS);

    expect(store.paying()).toBeFalse();
    expect(store.booking()?.status).toBe('paid');
    expect(TestBed.inject(GuestAccess).code()).toBeNull();
  }));

  it('reloads availability after SLOT_TAKEN', () => {
    store.courts.set([court]);
    store.courtId.set(1);
    store.date.set('2026-09-25');
    store.slots.set(slots);
    store.rangeStart.set(0);
    store.rangeEnd.set(0);
    store.guestName.set('Ana Perez');
    store.guestEmail.set('ana@test.com');
    store.guestPhone.set('3001234567');

    store.submit();
    const create = http.expectOne('/api/v1/bookings');
    create.flush({ error: 'Horario ocupado', code: 'SLOT_TAKEN' }, { status: 409, statusText: 'Conflict' });

    expect(store.error()).toContain('ocup');
    expect(store.rangeStart()).toBeNull();
    const reload = http.expectOne(
      (req) => req.url.includes('/api/v1/courts/1/availability') && req.params.get('date') === '2026-09-25',
    );
    reload.flush({ date: '2026-09-25', court, slots });
  });
});
