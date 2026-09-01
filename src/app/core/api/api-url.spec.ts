import { isLoginApiUrl, isOwnApiUrl } from './api-url';

describe('api-url', () => {
  it('accepts API, health and login paths', () => {
    expect(isOwnApiUrl('/api/v1/admin/courts')).toBeTrue();
    expect(isOwnApiUrl('/health')).toBeTrue();
    expect(isOwnApiUrl('/login')).toBeTrue();
  });

  it('rejects static assets and foreign origins', () => {
    expect(isOwnApiUrl('/assets/logo.png')).toBeFalse();
    expect(isOwnApiUrl('https://evil.example/api/v1/admin/courts')).toBeFalse();
  });

  it('detects only the login API path', () => {
    expect(isLoginApiUrl('/login')).toBeTrue();
    expect(isLoginApiUrl('/api/v1/user/login-history')).toBeFalse();
  });
});
