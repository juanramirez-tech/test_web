import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { adminGuard, authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasRole', 'logout']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  it('authGuard sends anonymous users to login', () => {
    auth.isAuthenticated.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result.toString()).toContain('/login');
  });

  it('adminGuard rejects non-admins', () => {
    auth.hasRole.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(result.toString()).toContain('/login');
  });

  it('guestGuard sends authenticated admins to /admin', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.hasRole.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result.toString()).toContain('/admin');
  });

  it('authGuard allows authenticated sessions', () => {
    auth.isAuthenticated.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBeTrue();
  });
});
