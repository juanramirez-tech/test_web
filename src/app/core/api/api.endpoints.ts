function assertPositiveInt(id: number, label: string): number {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} inválido`);
  }
  return id;
}

export const API = {
  health: '/health',
  login: '/login',
  v1: {
    courts: '/api/v1/courts',
    court: (id: number) => `/api/v1/courts/${assertPositiveInt(id, 'court_id')}`,
    courtsAvailability: '/api/v1/courts/availability',
    courtAvailability: (id: number) =>
      `/api/v1/courts/${assertPositiveInt(id, 'court_id')}/availability`,
    bookings: '/api/v1/bookings',
    myBooking: '/api/v1/bookings/mine',
    payBooking: '/api/v1/bookings/pay',
    cancelBooking: '/api/v1/bookings/cancel',
    admin: {
      courts: '/api/v1/admin/courts',
      court: (id: number) => `/api/v1/admin/courts/${assertPositiveInt(id, 'court_id')}`,
      bookings: '/api/v1/admin/bookings',
      booking: (id: number) => `/api/v1/admin/bookings/${assertPositiveInt(id, 'booking_id')}`,
      confirmBooking: (id: number) =>
        `/api/v1/admin/bookings/${assertPositiveInt(id, 'booking_id')}/confirm`,
      cancelBooking: (id: number) =>
        `/api/v1/admin/bookings/${assertPositiveInt(id, 'booking_id')}/cancel`,
    },
  },
} as const;
