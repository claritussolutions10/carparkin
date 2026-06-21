import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ParkingCard, { ParkingCardSkeleton } from '../../components/common/ParkingCard'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { searchParkings, type Parking } from '../../api/parkings.api'

const AMENITY_OPTIONS = ['CCTV', 'Covered', 'Security Guard', 'EV Charging', '24/7 Access', 'Well Lit', 'Near Metro']

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [parkings, setParkings] = useState<Parking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [city, setCity] = useState(searchParams.get('city') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [amenities, setAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  )
  const page = Number(searchParams.get('page') || '1')

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      const result = await searchParkings({
        city: city || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        page,
        limit: 12,
      })
      setParkings(result.parkings)
      setTotal(result.total)
    } catch {
      setParkings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [city, minPrice, maxPrice, amenities, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  const applyFilters = () => {
    const p = new URLSearchParams()
    if (city) p.set('city', city)
    if (minPrice) p.set('minPrice', minPrice)
    if (maxPrice) p.set('maxPrice', maxPrice)
    if (amenities.length) p.set('amenities', amenities.join(','))
    setSearchParams(p)
    setFiltersOpen(false)
  }

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  const totalPages = Math.ceil(total / 12)

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    setSearchParams(params)
  }

  const filterPanel = (
    <div className="space-y-4">
      <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Min Price (₹)" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="1000" />
        <Input label="Max Price (₹)" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="5000" />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-ink">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                amenities.includes(a) ? 'bg-navy text-white' : 'bg-concrete text-ink/60 hover:text-ink'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={applyFilters} className="w-full">Apply Filters</Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Find Parking</h1>
            {!loading && <p className="text-sm text-ink/50 mt-1">{total} result{total !== 1 ? 's' : ''} found</p>}
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink hover:bg-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="lg:hidden bg-white rounded-xl border border-line p-4 mb-6">{filterPanel}</div>
        )}

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-xl border border-line p-5 sticky top-6">
              <h2 className="font-display font-semibold text-ink mb-4">Filters</h2>
              {filterPanel}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => <ParkingCardSkeleton key={i} />)}
              </div>
            ) : parkings.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                }
                title="No parking found"
                description={city ? `No results in "${city}". Try expanding your search.` : 'Try adjusting your filters.'}
              />
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {parkings.map((p) => <ParkingCard key={p.id} parking={p} variant="driver" />)}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === page ? 'bg-navy text-white' : 'bg-white border border-line text-ink/60 hover:border-navy hover:text-navy'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
