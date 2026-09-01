import { isValidEmail, passwordClientError } from './credentials';

describe('credentials', () => {
  it('validates emails', () => {
    expect(isValidEmail('admin@jrtech.com')).toBeTrue();
    expect(isValidEmail('nope')).toBeFalse();
  });

  it('mirrors backend password rules', () => {
    expect(passwordClientError('short')).not.toBeNull();
    expect(passwordClientError('onlyletters')).not.toBeNull();
    expect(passwordClientError('Abcdefg1')).toBeNull();
  });
});
