import { safeInternalUrl } from './safe-internal-url';

describe('safeInternalUrl', () => {
  it('allows relative app routes', () => {
    expect(safeInternalUrl('/admin/dashboard')).toBe('/admin/dashboard');
  });

  it('rejects open redirects', () => {
    expect(safeInternalUrl('https://evil.example')).toBeNull();
    expect(safeInternalUrl('//evil.example')).toBeNull();
    expect(safeInternalUrl('/\\evil')).toBeNull();
    expect(safeInternalUrl('/login')).toBeNull();
  });
});
