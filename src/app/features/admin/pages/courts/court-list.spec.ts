import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Court } from '../../../../core/api/api.models';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { CourtList } from './court-list';

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

describe('CourtList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourtList],
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

  it('deactivates a court with PATCH status', () => {
    const fixture = TestBed.createComponent(CourtList);
    fixture.detectChanges();
    http.expectOne('/api/v1/admin/courts').flush([court]);

    fixture.componentInstance.askToggle(court);
    fixture.componentInstance.confirmPending();
    const patch = http.expectOne('/api/v1/admin/courts/1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'inactive' });
    patch.flush({ ...court, status: 'inactive' });

    expect(fixture.componentInstance.courts()[0].status).toBe('inactive');
  });

  it('deletes a court with DELETE', () => {
    const fixture = TestBed.createComponent(CourtList);
    fixture.detectChanges();
    http.expectOne('/api/v1/admin/courts').flush([court]);

    fixture.componentInstance.askDelete(court);
    fixture.componentInstance.confirmPending();
    const req = http.expectOne('/api/v1/admin/courts/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ok: true });

    expect(fixture.componentInstance.courts()).toEqual([]);
    expect(fixture.componentInstance.state()).toBe('empty');
  });

  it('opens create in a dialog without navigating', () => {
    const fixture = TestBed.createComponent(CourtList);
    fixture.detectChanges();
    http.expectOne('/api/v1/admin/courts').flush([court]);

    fixture.componentInstance.openCreate();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#court-dialog-title').textContent).toContain('Nueva cancha');
  });
});
