import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    sessionStorage.clear();
    storage = new TokenStorage();
  });

  afterEach(() => sessionStorage.clear());

  it('round-trips a session in memory and sessionStorage', () => {
    const session = {
      token: 'abc',
      userId: 1,
      email: 'admin@jrtech.com',
      role: 'admin' as const,
      expiresAt: Date.now() + 60_000,
    };
    storage.write(session);
    expect(storage.read()?.token).toBe('abc');
    storage.clear();
    expect(storage.read()).toBeNull();
  });
});
