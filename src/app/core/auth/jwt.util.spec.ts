import { isJwtExpired, parseJwtPayload, toAuthSession } from './jwt.util';

function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('jwt.util', () => {
  it('parses a well-formed payload', () => {
    const token = fakeJwt({
      id: 1,
      email: 'admin@jrtech.com',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const payload = parseJwtPayload(token);
    expect(payload?.email).toBe('admin@jrtech.com');
    expect(payload?.role).toBe('admin');
  });

  it('rejects malformed tokens', () => {
    expect(parseJwtPayload('not-a-jwt')).toBeNull();
    expect(parseJwtPayload('a.b')).toBeNull();
  });

  it('detects expired tokens', () => {
    const payload = {
      id: 1,
      email: 'admin@jrtech.com',
      role: 'admin' as const,
      exp: Math.floor(Date.now() / 1000) - 120,
    };
    expect(isJwtExpired(payload)).toBeTrue();
    expect(toAuthSession(fakeJwt(payload))).toBeNull();
  });

  it('accepts a valid admin session', () => {
    const session = toAuthSession(
      fakeJwt({
        id: 7,
        email: 'admin@jrtech.com',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    );
    expect(session?.userId).toBe(7);
    expect(session?.role).toBe('admin');
  });
});
