import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Booking } from '../../../../core/api/api.models';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { BookingDetailDialog } from './booking-detail';

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
      starts_at: '2026-12-01T13:00:00.000Z',
      ends_at: '2026-12-01T14:00:00.000Z',
    },
  ],
  createdAt: '2026-09-25T13:00:00.000Z',
  updatedAt: '2026-09-25T13:00:00.000Z',
};

describe('BookingDetailDialog', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BookingDetailDialog],
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('confirms a paid booking and skips confirm when not paid', () => {
    const fixture = TestBed.createComponent(BookingDetailDialog);
    fixture.componentRef.setInput('booking', paid);
    fixture.detectChanges();

    const saved = signal<Booking | null>(null);
    fixture.componentInstance.saved.subscribe((value) => saved.set(value));

    fixture.componentInstance.confirm();
    const post = http.expectOne('/api/v1/admin/bookings/9/confirm');
    expect(post.request.method).toBe('POST');
    post.flush({ ...paid, status: 'confirmed' });
    expect(saved()?.status).toBe('confirmed');

    fixture.componentRef.setInput('booking', { ...paid, status: 'confirmed' });
    fixture.detectChanges();
    fixture.componentInstance.confirm();
    http.expectNone('/api/v1/admin/bookings/9/confirm');
  });
});
