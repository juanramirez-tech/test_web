import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Court } from '../../../../core/api/api.models';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { CourtFormDialog } from './court-form';

const court: Court = {
  id: 1,
  name: 'Cancha 1',
  description: 'Césped',
  slot_minutes: 60,
  price_per_hour: '80000.00',
  opens_at: '08:00:00',
  closes_at: '22:00:00',
  timezone: 'America/Bogota',
  status: 'active',
};

describe('CourtFormDialog', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourtFormDialog],
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

  it('creates a court with POST', () => {
    const fixture = TestBed.createComponent(CourtFormDialog);
    fixture.componentRef.setInput('court', null);
    fixture.detectChanges();

    const saved = signal<Court | null>(null);
    fixture.componentInstance.saved.subscribe((value) => saved.set(value));

    fixture.componentInstance.form.setValue({
      name: 'Nueva',
      description: '',
      slot_minutes: 60,
      price_per_hour: 50000,
      opens_at: '08:00',
      closes_at: '22:00',
      timezone: 'America/Bogota',
      status: 'active',
    });
    fixture.componentInstance.save();

    const req = http.expectOne('/api/v1/admin/courts');
    expect(req.request.method).toBe('POST');
    req.flush({ ...court, id: 2, name: 'Nueva' });

    expect(saved()?.name).toBe('Nueva');
  });

  it('updates a court with PUT', () => {
    const fixture = TestBed.createComponent(CourtFormDialog);
    fixture.componentRef.setInput('court', court);
    fixture.detectChanges();

    fixture.componentInstance.save();
    const req = http.expectOne('/api/v1/admin/courts/1');
    expect(req.request.method).toBe('PUT');
    req.flush(court);
  });
});
