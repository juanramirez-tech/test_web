export type AppRole = 'admin' | 'user';

export type CourtStatus = 'active' | 'inactive';
export type SlotMinutes = 30 | 60;
export type SlotStatus = 'free' | 'held' | 'booked';
export type BookingStatus =
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export interface HealthResponse {
  status: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface Court {
  id: number;
  name: string;
  description?: string;
  slot_minutes: SlotMinutes;
  price_per_hour: string;
  opens_at: string;
  closes_at: string;
  timezone: string;
  status: CourtStatus;
}

export interface CourtWrite {
  name: string;
  description?: string;
  slot_minutes: SlotMinutes;
  price_per_hour: number;
  opens_at: string;
  closes_at: string;
  timezone?: string;
  status?: CourtStatus;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  status: SlotStatus;
}

export interface CourtAvailability {
  date: string;
  court: Court;
  slots: AvailabilitySlot[];
}

export interface MultiAvailability {
  date: string;
  courts: CourtAvailability[];
}

export interface BookingItemInput {
  court_id: number;
  starts_at: string;
  ends_at: string;
}

export interface BookingItem {
  court_id: number;
  starts_at: string;
  ends_at: string;
  court?: Court;
}

export interface Booking {
  id: number;
  access_code?: string;
  status: BookingStatus;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  total_amount: string;
  penalty_amount: string;
  refund_amount: string;
  paid_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  hold_expires_at: string | null;
  items: BookingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreate {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  simulate_payment?: boolean;
  items: BookingItemInput[];
}

export interface BookingList {
  total: number;
  bookings: Booking[];
}

export interface AdminBookingQuery {
  status?: BookingStatus;
  guest_email?: string;
  court_id?: number;
  date?: string;
  limit?: number;
  offset?: number;
}
