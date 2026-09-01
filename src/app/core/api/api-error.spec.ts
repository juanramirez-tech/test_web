import { toApiError } from './api-error';
import { API } from './api.endpoints';

describe('toApiError', () => {
  it('prefers the API error message and code', () => {
    const error = toApiError(409, { error: 'Horario ocupado', code: 'SLOT_TAKEN' });
    expect(error.message).toBe('Horario ocupado');
    expect(error.code).toBe('SLOT_TAKEN');
    expect(error.isConflict).toBeTrue();
  });

  it('falls back to a status message', () => {
    const error = toApiError(0, null);
    expect(error.message).toContain('conexión');
  });
});

describe('API endpoints', () => {
  it('builds admin paths with positive ids', () => {
    expect(API.v1.admin.court(3)).toBe('/api/v1/admin/courts/3');
    expect(API.v1.admin.confirmBooking(9)).toBe('/api/v1/admin/bookings/9/confirm');
  });

  it('rejects unsafe ids', () => {
    expect(() => API.v1.admin.court(0)).toThrowError();
    expect(() => API.v1.admin.booking(-1)).toThrowError();
    expect(() => API.v1.court(1.5)).toThrowError();
  });
});
