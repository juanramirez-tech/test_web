import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReservationStore } from '../../reservation/reservation.store';
import { GuestForm } from './guest-form';

describe('GuestForm', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [GuestForm],
      providers: [
        ReservationStore,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows per-field messages after blur', () => {
    const fixture = TestBed.createComponent(GuestForm);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLInputElement>('#guest-name')?.dispatchEvent(new Event('blur'));
    root.querySelector<HTMLInputElement>('#guest-email')?.dispatchEvent(new Event('blur'));
    root.querySelector<HTMLInputElement>('#guest-phone')?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const text = root.textContent ?? '';
    expect(text).toContain('al menos 3 caracteres');
    expect(text).toContain('correo válido');
    expect(text).toContain('número colombiano');
  });
});
