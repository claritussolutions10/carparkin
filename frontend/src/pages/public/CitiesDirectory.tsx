import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import PublicHeader from '../../components/layout/PublicHeader'
import PublicFooter from '../../components/layout/PublicFooter'
import { getListingCities, type CityListing } from '../../api/parkings.api'
import { slugifyCity, resolveCitySlug } from '../../lib/cityAliases'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'

export default function CitiesDirectory() {
  const [cities, setCities] = useState<CityListing[]>([])
  const [loading, setLoading] = useState(true)

  useDocumentMeta(
    'Browse Monthly Parking by City | Carparkin.in',
    'Find verified monthly parking spots in cities across India. Browse by city to see availability and pricing near you.'
  )

  useEffect(() => {
    getListingCities().then(setCities).catch(() => setCities([])).finally(() => setLoading(false))
  }, [])

  // Multiple raw city spellings (e.g. "Bangalore" and "Bengaluru") can resolve
  // to the same marketing slug - merge their counts into one card.
  const bySlug = new Map<string, { label: string; count: number }>()
  for (const c of cities) {
    const slug = slugifyCity(c.city)
    const existing = bySlug.get(slug)
    bySlug.set(slug, { label: resolveCitySlug(slug).label, count: (existing?.count ?? 0) + c.count })
  }
  const merged = [...bySlug.entries()].map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mt-6 md:mt-8 rounded-xl bg-navy py-12 md:py-16 px-6 text-center">
          <h1 className="font-display font-bold text-white text-3xl md:text-5xl leading-tight">
            Browse Parking by City
          </h1>
          <p className="mt-4 text-white/85 font-body text-sm md:text-base max-w-xl mx-auto">
            Verified monthly parking spots, city by city.
          </p>
        </section>

        <section className="mt-10 mb-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-20 bg-concrete rounded-xl animate-pulse" />)}
            </div>
          ) : merged.length === 0 ? (
            <p className="text-center text-sm text-ink/50 py-16">No listings yet — check back soon as we grow.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {merged.map((c) => (
                <Link
                  key={c.slug}
                  to={`/parking-in/${c.slug}`}
                  className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-line p-5 hover:border-green/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center shrink-0">
                      <MapPin className="text-green" size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-ink truncate">{c.label}</p>
                      <p className="text-xs text-ink/40">{c.count} listing{c.count === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink/30 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
