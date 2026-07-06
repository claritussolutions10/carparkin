import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import {
  MapPin, Star, ShieldCheck, Map as MapIcon, SlidersHorizontal,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import ParkingFilterPanel from '../../components/common/ParkingFilterPanel'
import { ParkingCardSkeleton } from '../../components/common/ParkingCard'
import { searchParkings, type Parking } from '../../api/parkings.api'
import { AMENITY_FILTERS, SORT_OPTIONS, amenityTags, availabilityBadge } from '../../lib/parkingFilters'

const PAGE_SIZE = 9
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 } // Bangalore — app default

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [parkings, setParkings] = useState<Parking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const [location, setLocation] = useState(searchParams.get('city') || '')
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 800)
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 4500)
  const [vehicleTypes, setVehicleTypes] = useState<Set<string>>(new Set())
  const [amenities, setAmenities] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('recommended')

  const page = Number(searchParams.get('page') || '1')
  const startDate = searchParams.get('startDate') || ''

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      const result = await searchParkings({
        city: searchParams.get('city') || undefined,
        minPrice: Number(searchParams.get('minPrice')) || undefined,
        maxPrice: Number(searchParams.get('maxPrice')) || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setParkings(result.parkings)
      setTotal(result.total)
    } catch {
      setParkings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchParams, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  const applyFilters = () => {
    const p = new URLSearchParams()
    if (location) p.set('city', location)
    if (startDate) p.set('startDate', startDate)
    p.set('minPrice', String(minPrice))
    p.set('maxPrice', String(maxPrice))
    setSearchParams(p)
    setMobileFiltersOpen(false)
  }

  const resetFilters = () => {
    setLocation('')
    setMinPrice(800)
    setMaxPrice(4500)
    setVehicleTypes(new Set())
    setAmenities(new Set())
    setSortBy('recommended')
    setSearchParams(new URLSearchParams())
  }

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    setSearchParams(params)
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

  const listingsWithCoords = parkings.filter((p) => p.latitude != null && p.longitude != null)
  const mapCenter = listingsWithCoords.length
    ? { lat: Number(listingsWithCoords[0].latitude), lng: Number(listingsWithCoords[0].longitude) }
    : DEFAULT_CENTER

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const locationLabel = searchParams.get('city') || 'your area'

  const filterPanel = (
    <ParkingFilterPanel
      location={location}
      onLocationChange={setLocation}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceChange={(mn, mx) => { setMinPrice(mn); setMaxPrice(mx) }}
      vehicleTypes={vehicleTypes}
      onVehicleTypesChange={setVehicleTypes}
      amenities={amenities}
      onAmenitiesChange={setAmenities}
      onApply={applyFilters}
      onReset={resetFilters}
    />
  )

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-[300px] shrink-0 space-y-6">
            <div className="relative h-40 rounded-xl overflow-hidden border border-line">
              <Map
                defaultCenter={mapCenter}
                defaultZoom={12}
                disableDefaultUI
                gestureHandling="none"
                mapId="carparkin-search-preview"
              >
                {listingsWithCoords.map((p) => (
                  <AdvancedMarker key={p.id} position={{ lat: Number(p.latitude), lng: Number(p.longitude) }} />
                ))}
              </Map>
              <button
                onClick={() => setMapOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
              >
                <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-medium text-ink shadow-md">
                  <MapIcon size={15} /> Show Map View
                </span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-line p-5 sticky top-6">
              {filterPanel}
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                {!loading && (
                  <h1 className="font-display text-2xl font-bold text-ink">
                    {visibleListings.length} Result{visibleListings.length !== 1 ? 's' : ''} found
                  </h1>
                )}
                <p className="text-sm text-ink/50 mt-1">Showing monthly parking spots in {locationLabel}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink hover:bg-white transition-colors"
                >
                  <SlidersHorizontal size={15} /> Filters
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-ink/50 shrink-0">Sort by:</span>
                  <Select
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => <ParkingCardSkeleton key={i} />)}
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
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {visibleListings.map((p) => {
                    const availability = availabilityBadge(p)
                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-line overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-navy to-navy-light overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-display font-bold text-white/25 text-5xl">P</span>
                          </div>
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-ink/60">
                            <ShieldCheck size={12} /> Verified
                          </span>
                          <span
                            className={`absolute top-3 right-3 rounded-md px-2 py-1 text-xs font-semibold ${
                              availability.tone === 'danger' ? 'bg-red-100 text-danger' : 'bg-white/90 text-ink/60'
                            }`}
                          >
                            {availability.label}
                          </span>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-semibold text-ink truncate">{p.title}</h3>
                            <span className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-ink">
                              <Star size={13} className="text-amber fill-amber" />
                              {p.rating != null ? Number(p.rating).toFixed(1) : 'New'}
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1 text-sm text-ink/50 truncate">
                            <MapPin size={12} className="shrink-0" />
                            {p.address}
                            {p.distance_km != null && <span>({Number(p.distance_km).toFixed(1)}km)</span>}
                          </p>

                          {amenityTags(p).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {amenityTags(p).map((tag) => (
                                <span key={tag} className="text-xs bg-concrete px-2 py-0.5 rounded-md text-ink/60">{tag}</span>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-line flex items-end justify-between">
                            <div>
                              <p className="text-xs text-ink/40">Monthly Price</p>
                              <p className="font-display text-lg font-bold text-ink">₹{Number(p.price_per_month).toLocaleString('en-IN')}</p>
                            </div>
                            <Link to={`/parking/${p.id}`}>
                              <Button>Book Now</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => goToPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-line text-ink/60 hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-2">
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink/30 px-1">…</span>}
                          <button
                            onClick={() => goToPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                              page === p ? 'bg-green text-white border-green' : 'bg-white border-line text-ink/60 hover:bg-concrete hover:border-green/40'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => goToPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-line text-ink/60 hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Modal open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
        {filterPanel}
      </Modal>

      <Modal open={mapOpen} onClose={() => setMapOpen(false)} title="Map View" maxWidth="max-w-3xl">
        <div className="h-[60vh] rounded-lg overflow-hidden">
          <Map defaultCenter={mapCenter} defaultZoom={12} gestureHandling="greedy" mapId="carparkin-search-full">
            {listingsWithCoords.map((p) => (
              <AdvancedMarker key={p.id} position={{ lat: Number(p.latitude), lng: Number(p.longitude) }} title={p.title} />
            ))}
          </Map>
        </div>
      </Modal>
    </div>
  )
}
