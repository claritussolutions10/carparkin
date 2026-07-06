import client from './client'

export interface Parking {
  id: string
  owner_id: string
  title: string
  description: string | null
  address: string
  latitude: number | null
  longitude: number | null
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
  owner_name: string | null
  distance_km?: number
  // Only present on the single-listing detail response (getParkingById), not search results.
  amenities?: { id: number; name: string; icon: string }[]
  images?: { id: string; url: string }[]
}

export interface SearchFilters {
  lat?: number
  lng?: number
  city?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface SearchResponse {
  parkings: Parking[]
  total: number
  page: number
  limit: number
}

export const searchParkings = (filters: SearchFilters) => {
  const params = new URLSearchParams()
  if (filters.lat) params.set('lat', String(filters.lat))
  if (filters.lng) params.set('lng', String(filters.lng))
  if (filters.city) params.set('city', filters.city)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  return client.get<SearchResponse>(`/parkings?${params}`).then((r) => r.data)
}

export const getParkingById = (id: string) =>
  client.get<{ parking: Parking }>(`/parkings/${id}`).then((r) => r.data.parking)

export interface ParkingReview {
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
}

export const getParkingReviews = (id: string, params?: { page?: number; limit?: number }) =>
  client.get<{ reviews: ParkingReview[]; total: number; page: number; limit: number }>(`/parkings/${id}/reviews`, { params }).then((r) => r.data)

// Owner-specific parking type (includes all DB columns + amenities array)
export interface OwnerParking {
  id: string
  owner_id: string
  title: string
  description: string | null
  address: string
  latitude: number | null
  longitude: number | null
  total_spaces: number
  available_spaces: number
  price_per_month: number
  price_per_week: number | null
  price_per_day: number | null
  has_cctv: boolean
  has_security_guard: boolean
  access_type: string | null
  is_active: boolean
  is_approved: boolean
  rating: number | null
  review_count: number
  parking_type: string | null
  amenities: { id: number; name: string; icon: string }[]
  images: { id: string; url: string }[]
}

export interface OwnerParkingInput {
  parking_type_id?: number
  title: string
  description?: string
  address: string
  latitude?: number
  longitude?: number
  total_spaces: number
  price_per_month: number
  price_per_week?: number
  price_per_day?: number
  has_cctv?: boolean
  has_security_guard?: boolean
  access_type?: string
  amenity_ids?: number[]
  image_urls?: { url: string; publicId: string }[]
}

export interface OwnerParkingUpdateInput {
  title?: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  total_spaces?: number
  price_per_month?: number
  price_per_week?: number
  price_per_day?: number
  has_cctv?: boolean
  has_security_guard?: boolean
  access_type?: string
  is_active?: boolean
}

export interface ParkingType {
  id: number
  name: string
  description: string | null
}

export interface Amenity {
  id: number
  name: string
  description: string | null
  icon: string | null
}

export const getParkingTypes = () =>
  client.get<{ types: ParkingType[] }>('/parkings/types').then((r) => r.data.types)

export const getAmenitiesList = () =>
  client.get<{ amenities: Amenity[] }>('/parkings/amenities').then((r) => r.data.amenities)

export const getOwnerParkings = () =>
  client.get<{ parkings: OwnerParking[] }>('/owners/parkings').then((r) => r.data.parkings)

export const getOwnerParking = (id: string) =>
  client.get<{ parking: OwnerParking }>(`/owners/parkings/${id}`).then((r) => r.data.parking)

export const createParking = (data: OwnerParkingInput) =>
  client.post<{ parking: OwnerParking }>('/owners/parkings', data).then((r) => r.data.parking)

export const updateParking = (id: string, data: OwnerParkingUpdateInput) =>
  client.put<{ parking: OwnerParking }>(`/owners/parkings/${id}`, data).then((r) => r.data.parking)

export const deleteParking = (id: string) =>
  client.delete(`/owners/parkings/${id}`).then((r) => r.data)

export const addParkingImages = (id: string, images: { url: string; publicId: string }[]) =>
  client.post<{ images: { id: string; url: string; display_order: number }[] }>(`/owners/parkings/${id}/images`, { images }).then((r) => r.data.images)

export const removeParkingImage = (id: string, imageId: string) =>
  client.delete(`/owners/parkings/${id}/images/${imageId}`).then((r) => r.data)

export interface BlackoutDate {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  created_at: string
}

export const getListingBlackouts = (id: string) =>
  client.get<{ blackouts: BlackoutDate[] }>(`/owners/parkings/${id}/blackouts`).then((r) => r.data.blackouts)

export const addListingBlackout = (id: string, data: { start_date: string; end_date: string; reason?: string }) =>
  client.post<{ blackout: BlackoutDate }>(`/owners/parkings/${id}/blackouts`, data).then((r) => r.data.blackout)

export const removeListingBlackout = (id: string, blackoutId: string) =>
  client.delete(`/owners/parkings/${id}/blackouts/${blackoutId}`).then((r) => r.data)
