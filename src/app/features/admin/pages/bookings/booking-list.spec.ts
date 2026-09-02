import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Booking, BookingStatus } from '../../../../core/api/api.models';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { BOOKING_STATUSES } from '../../admin-view';
import { BookingList } from './booking-list';

const paid: Booking = {
  id: 9,
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
      court: {
        id: 1,
        name: 'Cancha 1',
        slot_minutes: 60,
        price_per_hour: '80000.00',
        opens_at: '08:00:00',
        closes_at: '22:00:00',
        timezone: 'America/Bogota',
        status: 'active',
      },
    },
  ],
  createdAt: '2026-09-25T13:00:00.000Z',
  updatedAt: '2026-09-25T13:00:00.000Z',
};

function flushCounts(http: HttpTestingController): void {
  for (const status of BOOKING_STATUSES) {
    http
      .expectOne(
        (req) => req.url === '/api/v1/admin/bookings' && req.params.get('status') === status,
      )
      .flush({ total: status === 'paid' ? 4 : 0, bookings: [] });
  }
}

function flushList(
  http: HttpTestingController,
  body: { total: number; bookings: Booking[] },
  extra?: { status?: BookingStatus; date?: string },
): void {
  const req = http.expectOne(
    (request) =>
      request.url === '/api/v1/admin/bookings' &&
      request.params.get('limit') === '100' &&
      (extra?.status ? request.params.get('status') === extra.status : !request.params.get('status')),
  );
  if (extra?.date) {
    expect(req.request.params.get('date')).toBe(extra.date);
  }
  req.flush(body);
}

describe('BookingList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BookingList],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the interactive grid and sends date / status filters', () => {
    const fixture = TestBed.createComponent(BookingList);
    fixture.detectChanges();
    flushList(http, { total: 0, bookings: [] });
    flushCounts(http);

    const cmp = fixture.componentInstance;
    cmp.date = '2026-09-25';
    cmp.applyFilters();
    flushList(http, { total: 1, bookings: [paid] }, { date: '2026-09-25' });
    expect(cmp.rows().length).toBe(1);
    expect(cmp.rows()[0].phone).toBe('3001234567');
    expect(cmp.rows()[0].court).toBe('Cancha 1');

    cmp.selectStatus('paid');
    flushList(http, { total: 1, bookings: [paid] }, { status: 'paid', date: '2026-09-25' });
    expect(cmp.status).toBe('paid');
  });

  it('confirms a paid booking from the grid action', () => {
    const fixture = TestBed.createComponent(BookingList);
    fixture.detectChanges();
    flushList(http, { total: 1, bookings: [paid] });
    flushCounts(http);

    const row = fixture.componentInstance.rows()[0];
    fixture.componentInstance.askConfirm(row);
    fixture.componentInstance.confirmPending();

    const req = http.expectOne('/api/v1/admin/bookings/9/confirm');
    expect(req.request.method).toBe('POST');
    req.flush({ ...paid, status: 'confirmed', confirmed_at: '2026-09-25T14:00:00.000Z' });

    expect(fixture.componentInstance.rows()[0].status).toBe('confirmed');
    expect(fixture.componentInstance.counts().paid).toBe(3);
    expect(fixture.componentInstance.counts().confirmed).toBe(1);
  });

  it('opens the booking detail in a dialog', () => {
    const fixture = TestBed.createComponent(BookingList);
    fixture.detectChanges();
    flushList(http, { total: 1, bookings: [paid] });
    flushCounts(http);

    fixture.componentInstance.openDetail(fixture.componentInstance.rows()[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#booking-dialog-title').textContent).toContain(
      'Ana Perez',
    );
  });
});
