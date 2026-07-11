import client from './client'

export interface AdminProfile {
  id: string
  email: string
  full_name: string
  phone_number: string | null
  profile_picture: string | null
  role: string
  updated_at: string
}

export const updateAdminProfile = (data: { fullName?: string; phoneNumber?: string; profilePicture?: string }) =>
  client.put<{ profile: AdminProfile }>('/admin/profile', data).then((r) => r.data.profile)

export interface AdminStats {
  totalAccounts: number
  totalOwners: number
  totalUsers: number
  totalListings: number
  activeListings: number
  pendingApprovals: number
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalRevenue: number
  monthRevenue: number
  totalVehicles: number
  totalSpaces: number
  availableSpaces: number
  trends: {
    users: number | null
    owners: number | null
    listings: number | null
    bookings: number | null
    vehicles: number | null
  }
}

export interface BookingVolumePoint {
  date: string
  bookings: number
}

export interface AdminTransaction {
  id: string
  status: string
  payment_status: string
  total_price: number
  booking_start_date: string
  booking_end_date: string
  created_at: string
  listing_title: string
  user_name: string
  user_email: string
  owner_name: string
}

export const getAdminDashboard = () =>
  client.get<{ stats: AdminStats }>('/admin/dashboard').then((r) => r.data.stats)

export const getBookingVolume = (days = 30) =>
  client.get<{ volume: BookingVolumePoint[] }>('/admin/dashboard/booking-volume', { params: { days } }).then((r) => r.data.volume)

export const getAdminTransactions = (params?: { page?: number; limit?: number }) =>
  client.get<{ bookings: AdminTransaction[]; total: number; page: number; limit: number }>('/admin/bookings', { params }).then((r) => r.data)

export interface AdminBooking {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_status: string
  total_price: number
  booking_start_date: string
  booking_end_date: string
  duration_type: string
  created_at: string
  listing_id: string
  listing_title: string
  listing_address: string
  user_name: string
  user_email: string
  user_avatar: string | null
  owner_name: string
  registration_number: string
  vehicle_type: string
}

export interface BookingStats {
  activeCount: number
  pendingCount: number
  monthRevenue: number
  trends: { active: number | null; pending: number | null; revenue: number | null }
}

export const getAdminBookings = (params?: {
  search?: string; status?: string; locationId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number
}) =>
  client.get<{ bookings: AdminBooking[]; total: number }>('/admin/bookings', { params }).then((r) => r.data)

export const getAdminBookingStats = () =>
  client.get<{ stats: BookingStats }>('/admin/bookings/stats').then((r) => r.data.stats)

export const updateAdminBookingStatus = (id: string, status: 'confirmed' | 'cancelled' | 'completed') =>
  client.patch(`/admin/bookings/${id}/status`, { status }).then((r) => r.data)

export interface AdminListingOption {
  id: string
  title: string
}

export const getAdminListingOptions = () =>
  client.get<{ listings: AdminListingOption[]; total: number }>('/admin/listings', { params: { limit: 200 } }).then((r) => r.data.listings)

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: 'user' | 'owner' | 'admin'
  phone_number: string
  profile_picture: string | null
  is_active: boolean
  is_email_verified: boolean
  created_at: string
}

export const getAdminUsers = (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) =>
  client.get<{ users: AdminUser[]; total: number }>('/admin/users', { params }).then((r) => r.data)

export const updateAdminUserStatus = (id: string, isActive: boolean) =>
  client.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data)

export const updateAdminUser = (id: string, data: { fullName?: string; phoneNumber?: string; role?: 'user' | 'owner' }) =>
  client.patch(`/admin/users/${id}`, data).then((r) => r.data)

export interface AdminOwner {
  id: string
  full_name: string
  email: string
  phone_number: string
  profile_picture: string | null
  is_active: boolean
  created_at: string
  kyc_verified: boolean
  bank_account_verified: boolean
  listing_count: number
  revenue: number
}

export const getAdminOwners = (params?: {
  search?: string; status?: string; joinedFrom?: string; joinedTo?: string; page?: number; limit?: number
}) =>
  client.get<{ owners: AdminOwner[]; total: number }>('/admin/owners', { params }).then((r) => r.data)

export interface AdminLocation {
  id: string
  title: string
  address: string
  total_spaces: number
  available_spaces: number
  daily_price: number
  monthly_price: number
  is_approved: boolean
  is_active: boolean
  created_at: string
  owner_name: string
  owner_email: string
  thumbnail: string | null
}

export interface LocationStats {
  total: number
  pending: number
  active: number
  full: number
  trends: { total: number | null; pending: number | null }
}

export const getAdminLocations = (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
  client.get<{ listings: AdminLocation[]; total: number }>('/admin/listings', { params }).then((r) => r.data)

export const getAdminLocationStats = () =>
  client.get<{ stats: LocationStats }>('/admin/listings/stats').then((r) => r.data.stats)

export const updateAdminListingStatus = (id: string, isActive: boolean) =>
  client.patch(`/admin/listings/${id}/status`, { isActive }).then((r) => r.data)

export const updateAdminListing = (id: string, data: { title?: string; address?: string }) =>
  client.patch(`/admin/listings/${id}`, data).then((r) => r.data)

export interface PendingListing {
  id: string
  title: string
  address: string
  total_spaces: number
  available_spaces: number
  daily_price: number
  monthly_price: number
  created_at: string
  owner_name: string
  owner_email: string
  owner_avatar: string | null
  images: string[]
  amenities: string[]
}

export interface ApprovalStats {
  totalPending: number
  approvedToday: number
  rejectedToday: number
  topRejectionReason: string | null
}

export const getPendingListings = (search?: string) =>
  client.get<{ listings: PendingListing[] }>('/admin/listings/pending', { params: { search } }).then((r) => r.data.listings)

export const getApprovalStats = () =>
  client.get<{ stats: ApprovalStats }>('/admin/listings/approval-stats').then((r) => r.data.stats)

export const approveAdminListing = (id: string) =>
  client.post(`/admin/listings/${id}/approve`).then((r) => r.data)

export const rejectAdminListing = (id: string, reason: string) =>
  client.post(`/admin/listings/${id}/reject`, { reason }).then((r) => r.data)

export interface PlatformConfig {
  commissionRate: number
  requireListingApproval: boolean
  supportPhone: string
  supportEmail: string
  supportHours: string
  logoUrl: string | null
  heroImageUrl: string | null
  updatedAt: string
}

export const getAdminConfig = () =>
  client.get<{ config: PlatformConfig }>('/admin/config').then((r) => r.data.config)

export const updateAdminConfig = (data: Partial<{
  commissionRate: number; requireListingApproval: boolean; supportPhone: string; supportEmail: string; supportHours: string;
  logoUrl: string; heroImageUrl: string;
}>) =>
  client.put<{ config: PlatformConfig }>('/admin/config', data).then((r) => r.data.config)

export interface AdminAmenity {
  id: number
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
}

export const getAdminAmenities = () =>
  client.get<{ amenities: AdminAmenity[] }>('/admin/amenities').then((r) => r.data.amenities)

export const createAdminAmenity = (data: { name: string; description?: string; icon?: string }) =>
  client.post<{ amenity: AdminAmenity }>('/admin/amenities', data).then((r) => r.data.amenity)

export const updateAdminAmenity = (id: number, data: Partial<{ name: string; description: string; icon: string; isActive: boolean }>) =>
  client.patch<{ amenity: AdminAmenity }>(`/admin/amenities/${id}`, data).then((r) => r.data.amenity)

export interface AdminParkingType {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export const getAdminParkingTypes = () =>
  client.get<{ types: AdminParkingType[] }>('/admin/parking-types').then((r) => r.data.types)

export const createAdminParkingType = (data: { name: string; description?: string }) =>
  client.post<{ type: AdminParkingType }>('/admin/parking-types', data).then((r) => r.data.type)

export const updateAdminParkingType = (id: number, data: Partial<{ name: string; description: string; isActive: boolean }>) =>
  client.patch<{ type: AdminParkingType }>(`/admin/parking-types/${id}`, data).then((r) => r.data.type)

export interface AdminSubscriptionPlan {
  id: number
  name: string
  description: string | null
  price: number
  currency: string
  max_listings: number | null
  billing_cycle: string
  features: Record<string, unknown>
  is_active: boolean
}

export const getAdminSubscriptionPlans = () =>
  client.get<{ plans: AdminSubscriptionPlan[] }>('/admin/subscription-plans').then((r) => r.data.plans)

export const createAdminSubscriptionPlan = (data: {
  name: string; price: number; maxListings?: number; billingCycle?: string; features?: object;
}) =>
  client.post<{ plan: AdminSubscriptionPlan }>('/admin/subscription-plans', data).then((r) => r.data.plan)

export const updateAdminSubscriptionPlan = (id: number, data: Partial<{
  name: string; price: number; maxListings: number; billingCycle: string; features: object; isActive: boolean;
}>) =>
  client.patch<{ plan: AdminSubscriptionPlan }>(`/admin/subscription-plans/${id}`, data).then((r) => r.data.plan)

export interface AdminSupportTicket {
  id: string
  user_id: string
  user_name: string
  user_email: string
  subject: string
  message: string
  is_urgent: boolean
  status: 'open' | 'resolved'
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

export interface SupportTicketStats {
  openCount: number
  urgentCount: number
  resolvedToday: number
}

export const getAdminSupportTickets = (params?: { status?: string; urgentOnly?: boolean; page?: number; limit?: number }) =>
  client.get<{ tickets: AdminSupportTicket[]; total: number }>('/admin/support/tickets', { params }).then((r) => r.data)

export const getAdminSupportTicketStats = () =>
  client.get<{ stats: SupportTicketStats }>('/admin/support/tickets/stats').then((r) => r.data.stats)

export const replyAdminSupportTicket = (id: string, reply: string) =>
  client.patch<{ ticket: AdminSupportTicket }>(`/admin/support/tickets/${id}/reply`, { reply }).then((r) => r.data.ticket)

export interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  admin_name: string
  admin_email: string
}

export const getAdminAuditLog = (params?: { adminId?: string; action?: string; entityType?: string; page?: number; limit?: number }) =>
  client.get<{ entries: AuditLogEntry[]; total: number }>('/admin/audit-log', { params }).then((r) => r.data)

export interface PayoutStats {
  pendingCount: number
  pendingAmount: number
  paidThisMonth: number
  ownersAwaiting: number
}

export interface AdminPayout {
  id: string
  gross_amount: number
  commission_amount: number
  net_amount: number
  status: 'pending' | 'paid'
  transaction_date: string | null
  created_at: string
  owner_id: string
  owner_name: string
  owner_email: string
  listing_title: string
  booking_start_date: string
  booking_end_date: string
}

export const getAdminPayoutStats = () =>
  client.get<{ stats: PayoutStats }>('/admin/payouts/stats').then((r) => r.data.stats)

export const getAdminPayouts = (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
  client.get<{ payouts: AdminPayout[]; total: number }>('/admin/payouts', { params }).then((r) => r.data)

export const markAdminPayoutsPaid = (ids: string[]) =>
  client.post<{ updated: number }>('/admin/payouts/mark-paid', { ids }).then((r) => r.data)

export interface AdminReview {
  id: string
  rating: number
  review_text: string | null
  cleanliness_rating: number | null
  security_rating: number | null
  accessibility_rating: number | null
  is_verified_booking: boolean
  is_flagged: boolean
  created_at: string
  reviewer_name: string
  reviewer_email: string
  listing_id: string
  listing_title: string
}

export const getAdminReviews = (params?: { search?: string; maxRating?: number; page?: number; limit?: number }) =>
  client.get<{ reviews: AdminReview[]; total: number }>('/admin/reviews', { params }).then((r) => r.data)

export const deleteAdminReview = (id: string) =>
  client.delete(`/admin/reviews/${id}`).then((r) => r.data)

export interface RevenueReportRow {
  month: string
  bookings: number
  grossRevenue: number
  commissionRevenue: number
  ownerPayouts: number
}

export interface RevenueSummary {
  lifetimeGross: number
  lifetimeCommission: number
  monthGross: number
  monthCommission: number
}

export const getAdminRevenueReport = (months = 12) =>
  client.get<{ report: RevenueReportRow[]; summary: RevenueSummary }>('/admin/reports/revenue', { params: { months } }).then((r) => r.data)

export interface OwnerVerification {
  kyc_document_url: string | null
  kyc_document_type: string | null
  kyc_submitted_at: string | null
  kyc_verified: boolean
  kyc_rejected_reason: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  bank_account_holder_name: string | null
  bank_submitted_at: string | null
  bank_account_verified: boolean
  bank_rejected_reason: string | null
}

export const getAdminOwnerVerification = (ownerId: string) =>
  client.get<{ verification: OwnerVerification }>(`/admin/owners/${ownerId}/verification`).then((r) => r.data.verification)

export const reviewAdminOwnerKyc = (ownerId: string, verified: boolean, reason?: string) =>
  client.patch(`/admin/owners/${ownerId}/kyc`, { verified, reason }).then((r) => r.data)

export const reviewAdminOwnerBank = (ownerId: string, verified: boolean, reason?: string) =>
  client.patch(`/admin/owners/${ownerId}/bank`, { verified, reason }).then((r) => r.data)
