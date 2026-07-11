import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Building2, Camera, ShieldCheck, Car } from 'lucide-react'
import Button from '../../components/common/Button'
import DatePicker from '../../components/common/DatePicker'
import PublicHeader from '../../components/layout/PublicHeader'
import PublicFooter from '../../components/layout/PublicFooter'
import CitySkyline from '../../components/common/CitySkyline'
import FavoriteButton from '../../components/common/FavoriteButton'
import LocationAutocomplete from '../../components/common/LocationAutocomplete'
import { searchParkings, type Parking } from '../../api/parkings.api'
import { getPublicConfig } from '../../api/config.api'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'

function trendingBadge(p: Parking): { label: string; tone: 'gray' | 'danger' } | null {
  if (p.available_spaces > 0 && p.available_spaces <= 3) {
    return { label: `${p.available_spaces} Spot${p.available_spaces === 1 ? '' : 's'} Left`, tone: 'danger' }
  }
  if (p.rating != null && Number(p.rating) >= 4.5) return { label: 'Popular', tone: 'gray' }
  return null
}

export default function Home() {
  const navigate = useNavigate()
  useDocumentMeta(
    'Carparkin.in | Monthly Parking Spots Near You',
    'Find and book secure, affordable monthly parking spots in verified garages and private lots across India. Stop circling the block — reserve your spot today.'
  )
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [startDate, setStartDate] = useState('')
  const [trending, setTrending] = useState<Parking[]>([])
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)

  useEffect(() => {
    searchParkings({ limit: 3 })
      .then((res) => setTrending(res.parkings))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getPublicConfig().then((c) => setHeroImageUrl(c.heroImageUrl)).catch(() => {})
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (coords) {
      params.set('lat', String(coords.lat))
      params.set('lng', String(coords.lng))
      params.set('location', location.trim())
    } else if (location.trim()) {
      params.set('q', location.trim())
    }
    if (startDate) params.set('startDate', startDate)
    const qs = params.toString()
    navigate(`/search${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-concrete">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative mt-6 md:mt-8 rounded-xl overflow-hidden bg-navy min-h-[320px] md:h-[420px] flex flex-col justify-end">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-light" />
              <CitySkyline className="absolute bottom-0 left-0 w-full h-2/3 text-black/25" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/25 to-transparent" />

          <div className="relative px-6 py-8 md:px-10 md:py-10 max-w-full md:max-w-[55%]">
            <h1 className="font-display font-bold text-white text-3xl md:text-5xl leading-tight">
              Seamless Monthly Parking<br />for City Living
            </h1>
            <p className="mt-4 text-white/90 font-body text-sm md:text-base">
              Stop circling the block. Secure your monthly spot today in verified garages and private lots. Cancel anytime.
            </p>
          </div>
        </section>

        <div className="relative z-10 -mt-7 md:-mt-8 px-2 md:px-8">
          <form
            onSubmit={handleSearch}
            className="bg-surface rounded-xl shadow-lg border border-line max-w-3xl mx-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-line overflow-hidden"
          >
            <label className="flex items-center gap-2.5 px-5 py-3.5 flex-1 min-w-0">
              <Search size={16} className="text-ink/40 shrink-0" />
              <LocationAutocomplete
                value={location}
                onChange={(v) => { setLocation(v); setCoords(null) }}
                onSelect={(r) => { setLocation(r.description); setCoords({ lat: r.lat, lng: r.lng }) }}
                placeholder="City, Zip, or Neighborhood"
                className="w-full min-w-0 font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none"
              />
            </label>
            <div className="flex-1 min-w-0 px-5 py-3.5">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start Date"
                variant="bare"
              />
            </div>
            <button
              type="submit"
              className="bg-green text-white font-body font-medium text-sm px-8 py-3.5 hover:bg-green-light transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Trending Monthly Spots */}
        {trending.length > 0 && (
        <section className="mt-16 md:mt-20">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Trending Monthly Spots</h2>
              <p className="text-sm text-ink/50 mt-1">Popular locations booked by others in your area this week.</p>
            </div>
            <Link to="/search" className="text-sm font-medium text-green hover:text-green-light whitespace-nowrap transition-colors">
              View all listings →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending.map((listing) => {
              const badge = trendingBadge(listing)
              const amenities = [
                listing.has_cctv && { icon: Camera, label: 'CCTV' },
                listing.has_security_guard && { icon: ShieldCheck, label: 'Security' },
              ].filter((a): a is { icon: typeof Camera; label: string } => Boolean(a))
              return (
                <div
                  key={listing.id}
                  className="group bg-surface rounded-xl border border-line overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-navy to-navy-light overflow-hidden">
                    {listing.thumbnail_url ? (
                      <img src={listing.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="w-10 h-10 text-white/25" strokeWidth={1.5} />
                      </div>
                    )}
                    {badge && (
                      <span
                        className={`absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                          badge.tone === 'danger' ? 'bg-red-100 text-danger' : 'bg-white/90 text-slate-600'
                        }`}
                      >
                        {badge.label}
                      </span>
                    )}
                    <FavoriteButton listingId={listing.id} className="absolute top-3 right-3" />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-ink">{listing.title}</h3>
                      <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1">
                        ₹{Number(listing.price_per_month).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <p className="text-sm text-ink/50 mt-1">{listing.address}</p>

                    {amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                        {amenities.map((a) => (
                          <span key={a.label} className="inline-flex items-center gap-1 text-xs text-ink/60">
                            <a.icon size={13} />
                            {a.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link to={`/parking/${listing.id}`}>
                      <Button className="w-full mt-4">Book Now</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        )}

        {/* Owner CTA */}
        <section className="mt-16 md:mt-20 mb-16 rounded-xl bg-navy p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:justify-between text-center md:text-left">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 text-green text-xs font-semibold uppercase tracking-wider">
              <Building2 size={14} />
              For Property Owners
            </p>
            <h2 className="mt-3 font-display text-2xl md:text-3xl font-bold text-white">
              Have an empty spot? Earn passive income.
            </h2>
            <p className="mt-3 text-white/70 text-sm md:text-base">
              List your parking space on Carparkin in minutes. We handle the bookings, payments, and support so you don't have to.
            </p>
          </div>
          <Link to="/signup" className="shrink-0">
            <Button>List Your Space</Button>
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
