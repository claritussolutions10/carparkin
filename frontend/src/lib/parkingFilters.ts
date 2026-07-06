import type { Parking } from '../api/parkings.api'

export const PRICE_MIN = 0
export const PRICE_MAX = 10000

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Distance' },
]

// Amenities that map to real listing fields. "Electric Charging",
// "Wheelchair Access", and "Valet" have no backing field on the search/list
// endpoint (only the single-listing detail endpoint returns a real amenities
// list), so they're shown but don't filter.
export const AMENITY_FILTERS: { key: string; label: string; test: (p: Parking) => boolean }[] = [
  { key: 'cctv', label: 'CCTV Surveillance', test: (p) => p.has_cctv },
  { key: 'covered', label: 'Covered Parking', test: (p) => (p.parking_type || '').toLowerCase() === 'covered' },
  { key: '247', label: '24/7 Access', test: (p) => p.has_security_guard },
  { key: 'ev', label: 'Electric Charging', test: () => true },
  { key: 'accessible', label: 'Wheelchair Access', test: () => true },
  { key: 'valet', label: 'Valet', test: () => true },
]

// The parking domain model has no vehicle-type dimension (parking_type is
// about structure — Basement/Covered/etc — not the vehicle it fits), so
// this filter is UI-only for now and doesn't affect results.
export const VEHICLE_TYPES = [
  { key: 'sedan', label: 'Sedan / Hatchback' },
  { key: 'suv', label: 'SUV / Crossover' },
  { key: 'two', label: 'Two Wheeler' },
]

export function availabilityBadge(p: Parking): { label: string; tone: 'danger' | 'white' } {
  if (p.available_spaces === 1) return { label: 'Last spot!', tone: 'danger' }
  if (p.available_spaces > 1) return { label: `${p.available_spaces} spots left`, tone: 'white' }
  return { label: 'Available', tone: 'white' }
}

export function amenityTags(p: Parking): string[] {
  const tags: string[] = []
  if (p.has_cctv) tags.push('CCTV')
  if (p.has_security_guard) tags.push('Security')
  if (p.parking_type) tags.push(p.parking_type)
  return tags
}

export function toggleSet(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  setter(next)
}
