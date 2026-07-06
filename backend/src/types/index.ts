export type UserRole = 'user' | 'owner' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  profile_picture: string | null;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ParkingListingRow {
  id: string;
  owner_id: string;
  parking_type_id: number;
  title: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  total_spaces: number;
  available_spaces: number;
  price_per_month: number;
  price_per_week: number | null;
  price_per_day: number | null;
  has_cctv: boolean;
  has_security_guard: boolean;
  access_type: string | null;
  is_approved: boolean;
  approval_status: ApprovalStatus;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ParkingTypeRow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface AmenityRow {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

export interface VehicleRow {
  id: string;
  user_id: string;
  vehicle_type: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  year_manufactured: number | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BookingRow {
  id: string;
  user_id: string;
  parking_listing_id: string;
  vehicle_id: string;
  booking_start_date: Date;
  booking_end_date: Date;
  duration_days: number;
  duration_type: string | null;
  total_price: number;
  platform_commission: number | null;
  owner_payout: number | null;
  status: BookingStatus;
  payment_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SearchFilters {
  latitude?: number;
  longitude?: number;
  radius?: number;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
