import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import VacancyGauge from '../../components/common/VacancyGauge'
import Button from '../../components/common/Button'
import StaticMap from '../../components/common/StaticMap'
import { getParkingById, type Parking } from '../../api/parkings.api'

export default function ParkingDetail() {
  const { id } = useParams()
  const [parking, setParking] = useState<Parking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getParkingById(Number(id))
      .then(setParking)
      .catch(() => setError('Parking not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse space-y-6">
          <div className="h-64 bg-white rounded-xl" />
          <div className="h-8 w-1/2 bg-white rounded-lg" />
          <div className="h-4 w-1/3 bg-white rounded" />
          <div className="h-32 bg-white rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !parking) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Parking not found</h2>
          <p className="text-sm text-ink/50 mt-2">This listing may have been removed.</p>
          <Link to="/search" className="inline-block mt-6 text-sm font-medium text-navy hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-concrete pb-24 lg:pb-8">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/search" className="text-sm text-ink/50 hover:text-navy transition-colors">← Back to search</Link>

        <div className="mt-4 rounded-xl overflow-hidden">
          {parking.images.length > 0 ? (
            <img src={parking.images[0]} alt={parking.title} className="w-full h-64 md:h-80 object-cover" />
          ) : (
            <div className="w-full h-64 md:h-80 bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
              <svg className="w-16 h-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h5.25m-5.25 0v2.25m0-2.25L12 5.291A2.25 2.25 0 0 1 13.893 4.5h2.357c.82 0 1.573.452 1.961 1.175L20.25 9.75" />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">{parking.title}</h1>
              <p className="text-ink/50 mt-1">{parking.address}, {parking.city}</p>
            </div>

            {parking.description && (
              <div>
                <h2 className="font-display font-semibold text-ink mb-2">About</h2>
                <p className="text-sm text-ink/70 leading-relaxed">{parking.description}</p>
              </div>
            )}

            {parking.amenities.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-ink mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {parking.amenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-line rounded-lg text-sm text-ink/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-navy" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display font-semibold text-ink mb-3">Location</h2>
              {parking.latitude && parking.longitude ? (
                <StaticMap latitude={parking.latitude} longitude={parking.longitude} title={parking.title} />
              ) : (
                <div className="h-64 bg-white border border-line rounded-lg flex items-center justify-center text-ink/30 text-sm">
                  No location data available
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl border border-line p-6 sticky top-6 space-y-5">
              <div className="text-center">
                <p className="font-display text-3xl font-semibold text-navy">
                  ₹{parking.monthly_price.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-ink/40">per month</p>
              </div>

              <div className="flex justify-center">
                <VacancyGauge capacity={parking.capacity} vacancy={parking.vacancy} />
              </div>
              <p className="text-center text-sm text-ink/50">
                {parking.vacancy} of {parking.capacity} spots available
              </p>

              <Button className="w-full" disabled={parking.vacancy === 0}>
                {parking.vacancy === 0 ? 'No spots available' : 'Book Now'}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur-md border-t border-line px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-navy">₹{parking.monthly_price.toLocaleString('en-IN')}<span className="text-xs font-normal text-ink/40">/mo</span></p>
          <p className="text-xs text-ink/50">{parking.vacancy} spots left</p>
        </div>
        <Button disabled={parking.vacancy === 0}>
          {parking.vacancy === 0 ? 'Full' : 'Book Now'}
        </Button>
      </div>
    </div>
  )
}
