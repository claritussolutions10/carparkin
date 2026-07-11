import client from './client'

export interface UserDashboard {
  totalBookings: number
  activeBookings: number
  completedBookings: number
  cancelledBookings: number
  totalSpent: number
  reviewsWritten: number
  totalVehicles: number
  upcomingBookings: UserBooking[]
}

export interface UserBooking {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_status: string
  total_price: number
  booking_start_date: string
  booking_end_date: string
  duration_days: number
  duration_type: string
  listing_id?: string
  listing_title?: string
  listing_address?: string
  owner_name?: string
  owner_phone?: string
  registration_number?: string
  make?: string
  model?: string
  color?: string
  review_id?: string
  review_rating?: number
  // Only present on the single-booking detail response (getUserBookingById), not the list/dashboard ones.
  address?: string
  latitude?: number
  longitude?: number
  price_per_month?: number
  price_per_week?: number
  price_per_day?: number
  access_type?: string | null
  parking_type?: string
  owner_email?: string
  vehicle_type?: string
  review_text?: string | null
  images?: { id: string; url: string }[] | null
  amenities?: string[] | null
}

export interface Vehicle {
  id: string
  vehicle_type: string
  registration_number: string
  make: string
  model: string
  color: string | null
  year_manufactured: number | null
  is_primary: boolean
  is_active: boolean
  created_at: string
}

export interface VehicleInput {
  vehicle_type: string
  registration_number: string
  make: string
  model: string
  color?: string
  year_manufactured?: number
  is_primary?: boolean
}

export const getUserDashboard = () =>
  client.get<{ dashboard: UserDashboard }>('/user/dashboard').then((r) => r.data.dashboard)

export const getUserProfile = () =>
  client.get('/user/profile').then((r) => r.data.profile)

export const updateUserProfile = (data: { fullName?: string; phoneNumber?: string; profilePicture?: string }) =>
  client.put('/user/profile', data).then((r) => r.data.profile)

export const getUserBookings = (params?: { status?: string; page?: number; limit?: number }) =>
  client.get<{ bookings: UserBooking[]; total: number; page: number; limit: number }>('/user/bookings', { params }).then((r) => r.data)

export const getUserBookingById = (id: string) =>
  client.get<{ booking: UserBooking }>(`/user/bookings/${id}`).then((r) => r.data.booking)

export const cancelUserBooking = (id: string) =>
  client.delete(`/user/bookings/${id}`).then((r) => r.data)

export const getVehicles = () =>
  client.get<{ vehicles: Vehicle[] }>('/user/vehicles').then((r) => r.data.vehicles)

export const addVehicle = (data: VehicleInput) =>
  client.post<{ vehicle: Vehicle }>('/user/vehicles', data).then((r) => r.data.vehicle)

export const updateVehicle = (id: string, data: { color?: string; is_primary?: boolean }) =>
  client.put<{ vehicle: Vehicle }>(`/user/vehicles/${id}`, data).then((r) => r.data.vehicle)

export const removeVehicle = (id: string) =>
  client.delete(`/user/vehicles/${id}`).then((r) => r.data)

export const getUserReviews = (params?: { page?: number }) =>
  client.get('/user/reviews', { params }).then((r) => r.data)

export const writeReview = (bookingId: string, data: {
  rating: number
  reviewText?: string
  cleanlinessRating?: number
  securityRating?: number
  accessibilityRating?: number
}) => client.post(`/user/reviews/${bookingId}`, data).then((r) => r.data.review)

export interface SupportTicket {
  id: string
  subject: string
  message: string
  is_urgent: boolean
  status: 'open' | 'resolved'
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

export const createSupportTicket = (data: { subject: string; message: string; isUrgent?: boolean }) =>
  client.post<{ ticket: SupportTicket }>('/user/support/tickets', data).then((r) => r.data.ticket)

export const getMySupportTickets = () =>
  client.get<{ tickets: SupportTicket[] }>('/user/support/tickets').then((r) => r.data.tickets)

export interface FavoriteParking {
  favorite_id: string
  favorited_at: string
  id: string
  title: string
  address: string
  price_per_month: number
  price_per_week: number | null
  price_per_day: number | null
  total_spaces: number
  available_spaces: number
  has_cctv: boolean
  has_security_guard: boolean
  rating: number | null
  review_count: number
  parking_type: string | null
  thumbnail_url: string | null
}

export const getFavorites = () =>
  client.get<{ favorites: FavoriteParking[] }>('/user/favorites').then((r) => r.data.favorites)

export const addFavorite = (listingId: string) =>
  client.post(`/user/favorites/${listingId}`).then((r) => r.data)

export const removeFavorite = (listingId: string) =>
  client.delete(`/user/favorites/${listingId}`).then((r) => r.data)
