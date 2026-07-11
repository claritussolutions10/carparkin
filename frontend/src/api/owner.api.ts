import client from './client'

export interface OwnerDashboard {
  listings: { total: number; active: number; totalSpaces: number; availableSpaces: number }
  earnings: { total: number; thisMonth: number; totalBookings: number; activeBookings: number }
  recentBookings: Booking[]
}

export interface Booking {
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
  user_name?: string
  user_phone?: string
  user_email?: string
  registration_number?: string
  vehicle_type?: string
  make?: string
  model?: string
  color?: string
}

export interface MonthlyEarning {
  month: string
  transactions: number
  gross_amount: number
  commission: number
  net_amount: number
}

export interface Payout {
  id: string
  gross_amount: number
  commission_amount: number
  net_amount: number
  status: string
  transaction_date: string | null
  created_at: string
  listing_title: string
  user_name: string
}

export type VerificationStatus = 'unsubmitted' | 'pending' | 'verified' | 'rejected'

export interface OwnerSettings {
  id: string
  email: string
  full_name: string
  phone_number: string
  profile_picture: string | null
  is_email_verified: boolean
  requires_listing_approval: boolean
  kyc_verified: boolean
  bank_account_verified: boolean
  kyc_document_url: string | null
  kyc_document_type: string | null
  kyc_submitted_at: string | null
  kyc_rejected_reason: string | null
  kyc_status: VerificationStatus
  bank_account_number: string | null
  bank_ifsc: string | null
  bank_account_holder_name: string | null
  bank_submitted_at: string | null
  bank_rejected_reason: string | null
  bank_status: VerificationStatus
}

export interface Subscription {
  id: number
  status: string
  start_date: string
  end_date: string
  is_auto_renew: boolean
  plan_name: string
  price: number
  currency: string
  max_listings: number
  billing_cycle: string
  days_remaining: number
}

export const getOwnerDashboard = () =>
  client.get<OwnerDashboard>('/owner/dashboard').then((r) => r.data)

export const getOwnerBookings = (params?: { status?: string; page?: number; limit?: number; listingId?: string }) =>
  client.get<{ bookings: Booking[]; total: number; page: number; limit: number }>('/owner/bookings', { params }).then((r) => r.data)

export const getOwnerEarnings = (params?: { page?: number; limit?: number }) =>
  client.get('/owner/earnings', { params }).then((r) => r.data)

export const getMonthlyEarnings = (months = 12) =>
  client.get<{ monthly: MonthlyEarning[] }>('/owner/earnings/monthly', { params: { months } }).then((r) => r.data.monthly)

export const getPayouts = (params?: { page?: number; limit?: number }) =>
  client.get<{ payouts: Payout[]; total: number; page: number; limit: number }>('/owner/earnings/payouts', { params }).then((r) => r.data)

export const getOwnerSubscription = () =>
  client.get<{ subscription: Subscription | null }>('/owner/subscription').then((r) => r.data.subscription)

export const getOwnerSettings = () =>
  client.get<{ settings: OwnerSettings }>('/owner/settings').then((r) => r.data.settings)

export const updateOwnerSettings = (data: { fullName?: string; phoneNumber?: string; profilePicture?: string; requiresListingApproval?: boolean }) =>
  client.put<{ settings: OwnerSettings }>('/owner/settings', data).then((r) => r.data.settings)

export interface OwnerReview {
  id: string
  rating: number
  review_text: string | null
  cleanliness_rating: number | null
  security_rating: number | null
  accessibility_rating: number | null
  is_verified_booking: boolean
  owner_reply: string | null
  owner_replied_at: string | null
  created_at: string
  reviewer_name: string
  listing_id: string
  listing_title: string
}

export interface OwnerReviewStats {
  total: number
  averageRating: number
  unreplied: number
}

export const getOwnerReviews = (params?: { page?: number; limit?: number }) =>
  client.get<{ reviews: OwnerReview[]; total: number; stats: OwnerReviewStats }>('/owner/reviews', { params }).then((r) => r.data)

export const replyOwnerReview = (id: string, reply: string) =>
  client.patch(`/owner/reviews/${id}/reply`, { reply }).then((r) => r.data)

export const submitOwnerKyc = (data: { documentUrl: string; documentType: string }) =>
  client.post<{ settings: OwnerSettings }>('/owner/kyc', data).then((r) => r.data.settings)

export const submitOwnerBankDetails = (data: { accountNumber: string; ifsc: string; accountHolderName: string }) =>
  client.post<{ settings: OwnerSettings }>('/owner/bank-details', data).then((r) => r.data.settings)
