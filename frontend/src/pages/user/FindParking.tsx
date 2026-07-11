import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Map, AdvancedMarker, MapControl, ControlPosition, useMap } from '@vis.gl/react-google-maps'
import {
  Search, MapPin, SlidersHorizontal, Star,
  Umbrella, Camera, Zap, Accessibility, Car, Plus, Minus, LocateFixed, Map as MapIcon, X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import DatePicker from '../../components/common/DatePicker'
import EmptyState from '../../components/common/EmptyState'
import ParkingFilterPanel from '../../components/common/ParkingFilterPanel'
import { ParkingCardSkeleton } from '../../components/common/ParkingCard'
import NotificationBell from '../../components/common/NotificationBell'
import FavoriteButton from '../../components/common/FavoriteButton'
import LocationAutocomplete from '../../components/common/LocationAutocomplete'
import { searchParkings, type Parking } from '../../api/parkings.api'
import { AMENITY_FILTERS, SORT_OPTIONS, amenityTags } from '../../lib/parkingFilters'

const PAGE_SIZE = 20
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 } // Bangalore — app default

// Subset + relabeled view of the shared AMENITY_FILTERS keys, so the quick
// chips here and the full "All Filters" drawer stay backed by the same state.
const QUICK_FILTERS = [
  { key: 'covered', label: 'Covered', icon: Umbrella },
  { key: 'cctv', label: 'Security Camera', icon: Camera },
  { key: 'ev', label: 'EV Charging', icon: Zap },
  { key: 'accessible', label: 'Accessible', icon: Accessibility },
  { key: 'valet', label: 'Valet', icon: Car },
]

function MapOverlayControls({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  return (
    <div className="m-3 flex flex-col gap-2 items-end">
      <button
        onClick={() => { map?.panTo(center); map?.setZoom(14) }}
        className="w-9 h-9 rounded-full bg-surface shadow-md flex items-center justify-center text-ink/60 hover:text-green transition-colors"
        aria-label="Recenter map"
      >
        <LocateFixed size={16} />
      </button>
      <div className="bg-surface rounded-full shadow-md flex flex-col overflow-hidden">
        <button
          onClick={() => map?.setZoom((map.getZoom() ?? 14) + 1)}
          className="w-9 h-9 flex items-center justify-center text-ink/60 hover:text-green border-b border-line transition-colors"
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => map?.setZoom((map.getZoom() ?? 14) - 1)}
          className="w-9 h-9 flex items-center justify-center text-ink/60 hover:text-green transition-colors"
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  )
}

export default function FindParking() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const [parkings, setParkings] = useState<Parking[]>([])
  const [loading, setLoading] = useState(true)

  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('q') || '')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    searchParams.get('lat') && searchParams.get('lng')
      ? { lat: Number(searchParams.get('lat')), lng: Number(searchParams.get('lng')) }
      : null
  )
  const [dateInput, setDateInput] = useState(searchParams.get('startDate') || '')
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 800)
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 4500)
  const [vehicleTypes, setVehicleTypes] = useState<Set<string>>(new Set())
  const [amenities, setAmenities] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('recommended')

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileMapOpen, setMobileMapOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      const lat = searchParams.get('lat')
      const lng = searchParams.get('lng')
      const result = await searchParkings({
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        q: !lat ? searchParams.get('q') || undefined : undefined,
        minPrice: Number(searchParams.get('minPrice')) || undefined,
        maxPrice: Number(searchParams.get('maxPrice')) || undefined,
        page: 1,
        limit: PAGE_SIZE,
      })
      setParkings(result.parkings)
    } catch {
      setParkings([])
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => { fetchResults() }, [fetchResults])

  const commitSearch = () => {
    const p = new URLSearchParams()
    if (coords) {
      p.set('lat', String(coords.lat))
      p.set('lng', String(coords.lng))
      p.set('location', location)
    } else if (location) {
      p.set('q', location)
    }
    if (dateInput) p.set('startDate', dateInput)
    p.set('minPrice', String(minPrice))
    p.set('maxPrice', String(maxPrice))
    setSearchParams(p)
    setFiltersOpen(false)
  }

  const resetFilters = () => {
    setLocation('')
    setCoords(null)
    setDateInput('')
    setMinPrice(800)
    setMaxPrice(4500)
    setVehicleTypes(new Set())
    setAmenities(new Set())
    setSortBy('recommended')
    setSearchParams(new URLSearchParams())
  }

  const toggleAmenity = (key: string) => {
    setAmenities((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleListings = useMemo(() => {
    let list = parkings.filter((p) => {
      for (const key of amenities) {
        const filter = AMENITY_FILTERS.find((a) => a.key === key)
        if (filter && !filter.test(p)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price_per_month) - Number(b.price_per_month)
      if (sortBy === 'price_desc') return Number(b.price_per_month) - Number(a.price_per_month)
      if (sortBy === 'rating') return (b.rating != null ? Number(b.rating) : 0) - (a.rating != null ? Number(a.rating) : 0)
      if (sortBy === 'distance') return (a.distance_km != null ? Number(a.distance_km) : Infinity) - (b.distance_km != null ? Number(b.distance_km) : Infinity)
      return 0
    })

    return list
  }, [parkings, amenities, sortBy])

  // Derived, not fabricated: the cheapest listing in the current result set.
  const bestValueId = useMemo(() => {
    if (visibleListings.length === 0) return null
    return visibleListings.reduce((cheapest, p) =>
      Number(p.price_per_month) < Number(cheapest.price_per_month) ? p : cheapest
    ).id
  }, [visibleListings])

  const listingsWithCoords = visibleListings.filter((p) => p.latitude != null && p.longitude != null)
  const mapCenter = listingsWithCoords.length
    ? { lat: Number(listingsWithCoords[0].latitude), lng: Number(listingsWithCoords[0].longitude) }
    : DEFAULT_CENTER

  return (
    <div className="p-6 md:p-10">
      {/* Top content bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Find Parking</h1>
          <p className="text-sm text-ink/50 mt-1">Discover and book the perfect spot nearby.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-display font-semibold text-sm">
            {user?.full_name?.[0] ?? 'U'}
          </div>
        </div>
      </div>

      {/* Inline search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); commitSearch() }}
        className="bg-surface rounded-xl border border-line shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-line overflow-hidden mb-5"
      >
        <label className="flex items-center gap-2.5 px-5 py-3.5 flex-1 min-w-0">
          <MapPin size={16} className="text-ink/40 shrink-0" />
          <LocationAutocomplete
            value={location}
            onChange={(v) => { setLocation(v); setCoords(null) }}
            onSelect={(r) => { setLocation(r.description); setCoords({ lat: r.lat, lng: r.lng }) }}
            placeholder="Where do you want to park?"
            className="w-full min-w-0 font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          />
        </label>
        <div className="flex-1 min-w-0 px-5 py-3.5">
          <DatePicker
            value={dateInput}
            onChange={setDateInput}
            placeholder="Select dates & times"
            variant="bare"
          />
        </div>
        <button type="submit" className="flex items-center justify-center gap-2 bg-green text-white font-body font-medium text-sm px-6 py-3.5 hover:bg-green-light transition-colors">
          <Search size={15} /> Search
        </button>
      </form>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-green text-white px-4 py-2 text-sm font-medium shrink-0"
        >
          <SlidersHorizontal size={14} /> All Filters
        </button>
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => toggleAmenity(f.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shrink-0 transition-colors ${
              amenities.has(f.key) ? 'bg-green text-white border-green' : 'bg-surface text-ink/60 border-line hover:border-green/40'
            }`}
          >
            <f.icon size={14} /> {f.label}
          </button>
        ))}
      </div>

      {/* Split view */}
      <div className="grid lg:grid-cols-[40fr_60fr] gap-6">
        {/* Results list */}
        <div className={mobileMapOpen ? 'hidden lg:block' : ''}>
          <div className="flex items-center justify-between gap-3 mb-4">
            {!loading && (
              <p className="text-sm text-ink/60">
                <span className="font-bold text-green">{visibleListings.length}</span> Results found
              </p>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-ink/50 shrink-0">Sort by:</span>
              <Select options={SORT_OPTIONS} value={sortBy} onChange={(e) => setSortBy(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => <ParkingCardSkeleton key={i} />)}
            </div>
          ) : visibleListings.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              }
              title="No parking found"
              description={location ? `No results for "${location}". Try a different search.` : 'No listings available yet.'}
            />
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
              {visibleListings.map((p) => {
                const isBestValue = p.id === bestValueId
                const isActive = hoveredId === p.id || selectedId === p.id
                const canBookNow = p.available_spaces > 0
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(p.id)}
                    className={`bg-surface rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      isActive ? 'border-green shadow-md' : 'border-line hover:shadow-sm'
                    }`}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-navy to-navy-light overflow-hidden">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="text-white/25" size={28} />
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink shadow">
                        <Star size={11} className="text-amber fill-amber" />
                        {p.rating != null ? Number(p.rating).toFixed(1) : 'New'}
                      </span>
                      <FavoriteButton listingId={p.id} className="absolute top-2.5 right-2.5" />
                      {isBestValue && (
                        <span className="absolute top-11 right-2.5 rounded-full bg-green px-2.5 py-0.5 text-xs font-semibold text-white">
                          Best Value
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold text-ink truncate">{p.title}</h3>
                        <div className="text-right shrink-0">
                          <p className="font-display font-bold text-ink">₹{Number(p.price_per_month).toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-ink/40 -mt-0.5">/month</p>
                        </div>
                      </div>

                      <p className="mt-1 flex items-center gap-1 text-xs text-ink/50 truncate">
                        <MapPin size={11} className="shrink-0" />
                        {p.distance_km != null && <span>{Number(p.distance_km).toFixed(1)} km away •</span>} {p.address}
                      </p>

                      {amenityTags(p).length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {amenityTags(p).map((tag) => (
                            <span key={tag} className="text-[10px] font-medium uppercase tracking-wide bg-concrete px-2 py-0.5 rounded-md text-ink/50">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {canBookNow ? (
                        <Link to={`/parking/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button className="w-full mt-3">Book Now</Button>
                        </Link>
                      ) : (
                        <Link to={`/parking/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" className="w-full mt-3">View Details</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className={`relative rounded-xl overflow-hidden border border-line h-[70vh] lg:sticky lg:top-10 ${mobileMapOpen ? '' : 'hidden lg:block'}`}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={13}
            disableDefaultUI
            gestureHandling="greedy"
            mapId="carparkin-find-parking"
          >
            {listingsWithCoords.map((p) => {
              const isActive = hoveredId === p.id || selectedId === p.id
              return (
                <AdvancedMarker
                  key={p.id}
                  position={{ lat: Number(p.latitude), lng: Number(p.longitude) }}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer transition-colors whitespace-nowrap ${
                      isActive ? 'bg-green text-white' : 'bg-navy text-white'
                    }`}
                  >
                    ₹{Number(p.price_per_month).toLocaleString('en-IN')}
                  </div>
                </AdvancedMarker>
              )
            })}
            <MapControl position={ControlPosition.RIGHT_BOTTOM}>
              <MapOverlayControls center={mapCenter} />
            </MapControl>
          </Map>

          <button
            onClick={() => setMobileMapOpen(false)}
            className="lg:hidden absolute top-3 left-3 inline-flex items-center gap-1.5 bg-surface rounded-full px-3.5 py-2 text-sm font-medium text-ink shadow-md"
          >
            <X size={14} /> Close Map
          </button>
        </div>
      </div>

      {/* Mobile floating map toggle */}
      {!mobileMapOpen && (
        <button
          onClick={() => setMobileMapOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 inline-flex items-center gap-2 bg-navy text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg z-30"
        >
          <MapIcon size={16} /> Map
        </button>
      )}

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <ParkingFilterPanel
          location={location}
          onLocationChange={(v) => { setLocation(v); setCoords(null) }}
          onLocationSelect={setCoords}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(mn, mx) => { setMinPrice(mn); setMaxPrice(mx) }}
          vehicleTypes={vehicleTypes}
          onVehicleTypesChange={setVehicleTypes}
          amenities={amenities}
          onAmenitiesChange={setAmenities}
          onApply={commitSearch}
          onReset={resetFilters}
        />
      </Modal>
    </div>
  )
}
