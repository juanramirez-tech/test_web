import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['token', 'isAuthenticated', 'logout']);
    auth.token.and.returnValue('jwt-admin');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds Bearer only on own API urls', () => {
    http.get('/api/v1/admin/courts').subscribe();
    const api = controller.expectOne('/api/v1/admin/courts');
    expect(api.request.headers.get('Authorization')).toBe('Bearer jwt-admin');
    api.flush([]);

    http.get('/assets/logo.png').subscribe();
    const asset = controller.expectOne('/assets/logo.png');
    expect(asset.request.headers.has('Authorization')).toBeFalse();
    asset.flush('');
  });
});
