import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SESSION_STORAGE_KEY } from './token-storage';

function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('sends trimmed email without forcing lowercase', () => {
    service.login({ email: '  Admin@JRTech.com  ', password: 'Abcdefg1' }).subscribe({
      error: () => undefined,
    });
    const req = http.expectOne('/login');
    expect(req.request.body.email).toBe('Admin@JRTech.com');
    req.flush({ error: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('stores only admin sessions', () => {
    const token = fakeJwt({
      id: 1,
      email: 'admin@jrtech.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    service.login({ email: 'admin@jrtech.com', password: 'Abcdefg1' }).subscribe();
    http.expectOne('/login').flush({ message: 'ok', token });

    expect(service.hasRole('admin')).toBeTrue();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toContain('"token"');
  });

  it('rejects a user-role token', () => {
    const token = fakeJwt({
      id: 2,
      email: 'user@jrtech.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    let status: number | undefined;
    service.login({ email: 'user@jrtech.com', password: 'Abcdefg1' }).subscribe({
      error: (err) => {
        status = err.status;
      },
    });
    http.expectOne('/login').flush({ message: 'ok', token });
    expect(status).toBe(403);
    expect(service.isAuthenticated()).toBeFalse();
  });
});
