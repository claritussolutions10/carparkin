import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Button from '../../components/common/Button'
import PublicHeader from '../../components/layout/PublicHeader'
import PublicFooter from '../../components/layout/PublicFooter'
import ParkingCard, { ParkingCardSkeleton } from '../../components/common/ParkingCard'
import EmptyState from '../../components/common/EmptyState'
import { searchParkings, type Parking } from '../../api/parkings.api'
import { resolveCitySlug } from '../../lib/cityAliases'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'

const PAGE_SIZE = 24

export default function CityParking() {
  const { citySlug = '' } = useParams<{ citySlug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')

  const [parkings, setParkings] = useState<Parking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const { label, names } = resolveCitySlug(citySlug)

  useDocumentMeta(
    `Monthly Parking in ${label} | Carparkin.in`,
    `Find and book verified monthly parking spots in ${label}. Compare prices, amenities, and availability — reserve your spot in minutes.`
  )

  useEffect(() => {
    setLoading(true)
    searchParkings({ cities: names, page, limit: PAGE_SIZE })
      .then((r) => { setParkings(r.parkings); setTotal(r.total) })
      .catch(() => { setParkings([]); setTotal(0) })
      .finally(() => setLoading(false))
    // names is derived fresh from citySlug each render but is stable in content per slug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug, page])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    setSearchParams(params)
  }

  return (
    <div className="min-h-screen bg-concrete">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mt-6 md:mt-8 rounded-xl bg-navy py-12 md:py-16 px-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            <MapPin size={12} /> {label}
          </span>
          <h1 className="mt-4 font-display font-bold text-white text-3xl md:text-5xl leading-tight">
            Monthly Parking in {label}
          </h1>
          <p className="mt-4 text-white/85 font-body text-sm md:text-base max-w-xl mx-auto">
            {total > 0
              ? `${total} verified parking spot${total === 1 ? '' : 's'} available in ${label}. Compare prices and book in minutes.`
              : `Find and book monthly parking in ${label} — verified spots, transparent pricing, no hidden fees.`}
          </p>
        </section>

        <section className="mt-10 mb-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => <ParkingCardSkeleton key={i} />)}
            </div>
          ) : parkings.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-16 h-16" strokeWidth={1} />}
              title={`No listings in ${label} yet`}
              description="We're growing city by city — check back soon, or be the first to list a space here."
            />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {parkings.map((p) => <ParkingCard key={p.id} parking={p} variant="user" />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                        page === p ? 'bg-green text-white border-green' : 'bg-surface border-line text-ink/60 hover:bg-concrete hover:border-green/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-10 text-center">
            <Link to="/signup">
              <Button variant="secondary">List Your Space in {label}</Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
