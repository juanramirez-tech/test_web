export const environment = {
  production: true,
  /**
   * Vacío = same-origin (nginx/BFF delante de la API).
   * El reverse proxy inyecta la cabecera `auth` en POST /login.
   * Nunca pongas AUTH ni JWT_SECRET aquí: el bundle es público.
   */
  apiBaseUrl: '',
};
