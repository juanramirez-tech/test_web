import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { USE_GUEST_ACCESS } from '../api/http-contexts';
import { GuestAccess } from '../guest/guest-access';
import { guestAccessInterceptor } from './guest-access.interceptor';

describe('guestAccessInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([guestAccessInterceptor])), provideHttpClientTesting()],
    });
    TestBed.inject(GuestAccess).save('49dbb779c840415481bbcd4fbafe40f5');
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('adds X-Access-Code only when the context asks for it', () => {
    http.get('/api/v1/bookings/mine', { context: new HttpContext().set(USE_GUEST_ACCESS, true) }).subscribe();
    const mine = controller.expectOne('/api/v1/bookings/mine');
    expect(mine.request.headers.get('X-Access-Code')).toBe('49dbb779c840415481bbcd4fbafe40f5');
    mine.flush({});

    http.get('/api/v1/courts').subscribe();
    const courts = controller.expectOne('/api/v1/courts');
    expect(courts.request.headers.has('X-Access-Code')).toBeFalse();
    courts.flush([]);
  });
});
