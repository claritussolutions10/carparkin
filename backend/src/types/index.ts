export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface ParkingRow {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  monthly_price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
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
