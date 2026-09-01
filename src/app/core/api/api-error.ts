export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter?: string;

  constructor(status: number, message: string, code?: string, retryAfter?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isUnprocessable(): boolean {
    return this.status === 422;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  0: 'No hay conexión con el servidor',
  400: 'Solicitud inválida',
  401: 'Sesión no válida o credenciales incorrectas',
  403: 'No tienes permiso para esta acción',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el estado actual',
  422: 'La operación no es válida en este estado',
  429: 'Demasiadas solicitudes. Intenta más tarde',
  500: 'Error interno del servidor',
  503: 'Servicio no disponible',
};

function readErrorBody(error: unknown): { message?: string; code?: string } {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const body = error as { error?: unknown; message?: unknown; code?: unknown };
  const message =
    typeof body.error === 'string'
      ? body.error
      : typeof body.message === 'string'
        ? body.message
        : undefined;
  const code = typeof body.code === 'string' ? body.code : undefined;
  return { message, code };
}

export function toApiError(
  status: number,
  body: unknown,
  fallback?: string,
  retryAfter?: string | null,
): ApiError {
  const parsed = readErrorBody(body);
  const message =
    parsed.message || fallback || STATUS_MESSAGES[status] || `Error inesperado (${status})`;
  return new ApiError(status, message, parsed.code, retryAfter ?? undefined);
}
