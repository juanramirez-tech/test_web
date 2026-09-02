import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { Court } from '../../../../core/api/api.models';
import { Dashboard } from './dashboard';

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

describe('Dashboard', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
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

  it('loads court and booking totals from list endpoints', () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    http.expectOne('/api/v1/admin/courts').flush([court, { ...court, id: 2, status: 'inactive' }]);
    http.expectOne((req) => req.url === '/api/v1/admin/bookings' && req.params.get('limit') === '50').flush({
      total: 8,
      bookings: [],
    });
    http
      .expectOne(
        (req) =>
          req.url === '/api/v1/admin/bookings' && req.params.get('status') === 'pending_payment',
      )
      .flush({ total: 1, bookings: [] });
    http
      .expectOne((req) => req.url === '/api/v1/admin/bookings' && req.params.get('status') === 'paid')
      .flush({ total: 4, bookings: [] });
    http
      .expectOne(
        (req) => req.url === '/api/v1/admin/bookings' && req.params.get('status') === 'confirmed',
      )
      .flush({ total: 2, bookings: [] });
    http
      .expectOne(
        (req) => req.url === '/api/v1/admin/bookings' && req.params.get('status') === 'cancelled',
      )
      .flush({ total: 3, bookings: [] });
    http
      .expectOne(
        (req) => req.url === '/api/v1/admin/bookings' && req.params.get('status') === 'expired',
      )
      .flush({ total: 0, bookings: [] });

    const cmp = fixture.componentInstance;
    expect(cmp.courtTotal()).toBe(2);
    expect(cmp.courtsActive()).toBe(1);
    expect(cmp.bookingCounts().paid).toBe(4);
    expect(cmp.bookingCounts().confirmed).toBe(2);
    expect(cmp.state()).toBe('ready');
  });
});
