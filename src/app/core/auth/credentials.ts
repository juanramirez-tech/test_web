export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordClientError(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'La contraseña debe tener entre 8 y 128 caracteres';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir letras y números';
  }
  return null;
}
