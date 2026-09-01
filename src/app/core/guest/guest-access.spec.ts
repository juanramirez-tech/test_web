import { GuestAccess, isAccessCode } from './guest-access';

describe('GuestAccess', () => {
  let guest: GuestAccess;

  beforeEach(() => {
    sessionStorage.clear();
    guest = new GuestAccess();
  });

  afterEach(() => sessionStorage.clear());

  it('rejects codes that are not opaque tokens', () => {
    expect(isAccessCode('short')).toBeFalse();
    expect(isAccessCode('../etc/passwd')).toBeFalse();
    expect(guest.save('abc')).toBeFalse();
    expect(guest.code()).toBeNull();
  });

  it('stores a valid code without putting it in a URL', () => {
    expect(guest.save('49dbb779c840415481bbcd4fbafe40f5')).toBeTrue();
    expect(guest.code()).toBe('49dbb779c840415481bbcd4fbafe40f5');
    expect(guest.masked()).toContain('…');
    expect(guest.masked()).not.toBe(guest.code());
  });
});
