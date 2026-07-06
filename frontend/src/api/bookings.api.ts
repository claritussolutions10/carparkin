import client from './client'

export interface AvailabilityResult {
  isAvailable: boolean
  availableSpaces: number
  totalSpaces: number
  message: string
}

export interface PricingEstimate {
  listingId: string
  listingTitle: string
  startDate: string
  endDate: string
  durationDays: number
  priceBreakdown: Record<string, { count: number; priceEach: number; total: number }>
  subtotal: number
  platformCommission: number
  totalPrice: number
  ownerPayout: number
}

export interface BookingRecord {
  id: string
  user_id: string
  parking_listing_id: string
  vehicle_id: string
  booking_start_date: string
  booking_end_date: string
  duration_days: number
  duration_type: string
  total_price: number
  platform_commission: number
  owner_payout: number
  status: string
  payment_status: string
  razorpay_payment_id: string | null
}

export const checkAvailability = (listingId: string, startDate: string, endDate: string) =>
  client.get<AvailabilityResult>('/bookings/check-availability', {
    params: { listingId, startDate, endDate },
  }).then((r) => r.data)

export const getPricingEstimate = (listingId: string, startDate: string, endDate: string) =>
  client.get<{ estimate: PricingEstimate }>('/bookings/pricing-estimate', {
    params: { listingId, startDate, endDate },
  }).then((r) => r.data.estimate)

export const createBooking = (data: {
  listingId: string
  vehicleId: string
  startDate: string
  endDate: string
}) => client.post<{ booking: BookingRecord; message: string }>('/bookings', data).then((r) => r.data)

export const confirmBooking = (bookingId: string, razorpayPaymentId?: string) =>
  client.post<{ booking: BookingRecord }>(`/bookings/${bookingId}/confirm`, {
    razorpayPaymentId,
  }).then((r) => r.data.booking)

export const processTestPayment = (bookingId: string, amount: number) =>
  client.post<{
    success: boolean
    paymentId: string
    status: string
    message: string
    bookingId: string
    amount: number
  }>('/payments/test/process', { bookingId, amount }).then((r) => r.data)
