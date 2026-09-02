import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router, ActivatedRoute } from '@angular/router';
import { Login } from './login';

function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('Login', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ returnUrl: 'https://evil.com' }),
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('logs in and ignores an open-redirect returnUrl', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      email: 'admin@jrtech.com',
      password: 'Abcdefg1',
    });
    fixture.componentInstance.submit();

    const token = fakeJwt({
      id: 1,
      email: 'admin@jrtech.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const req = http.expectOne('/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok', token });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });
});
