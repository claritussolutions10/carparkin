import client from './client'

export interface Parking {
  id: number
  owner_id: number
  title: string
  description: string | null
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  monthly_price: number
  capacity: number
  vacancy: number
  amenities: string[]
  images: string[]
  status: string
  created_at: string
  updated_at: string
}

export interface ParkingInput {
  title: string
  description?: string
  address: string
  city: string
  latitude?: number
  longitude?: number
  monthlyPrice: number
  capacity: number
  amenities?: string[]
  images?: string[]
}

export interface SearchFilters {
  city?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
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
  if (filters.city) params.set('city', filters.city)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','))
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  return client.get<SearchResponse>(`/parkings?${params}`).then((r) => r.data)
}

export const getParkingById = (id: number) =>
  client.get<{ parking: Parking }>(`/parkings/${id}`).then((r) => r.data.parking)

export const getOwnerParkings = () =>
  client.get<{ parkings: Parking[] }>('/owners/parkings').then((r) => r.data.parkings)

export const getOwnerParking = (id: number) =>
  client.get<{ parking: Parking }>(`/owners/parkings/${id}`).then((r) => r.data.parking)

export const createParking = (data: ParkingInput) =>
  client.post<{ parking: Parking }>('/owners/parkings', data).then((r) => r.data.parking)

export const updateParking = (id: number, data: Partial<ParkingInput>) =>
  client.put<{ parking: Parking }>(`/owners/parkings/${id}`, data).then((r) => r.data.parking)

export const deleteParking = (id: number) =>
  client.delete(`/owners/parkings/${id}`).then((r) => r.data)
