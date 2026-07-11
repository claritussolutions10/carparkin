import { Link } from 'react-router-dom'
import type { Parking } from '../../api/parkings.api'
import VacancyGauge from './VacancyGauge'

interface ParkingCardProps {
  parking: Parking
  variant: 'owner' | 'user'
  onEdit?: () => void
  onDelete?: () => void
}


export default function ParkingCard({ parking, variant, onEdit, onDelete }: ParkingCardProps) {
  const badges: string[] = []
  if (parking.has_cctv) badges.push('CCTV')
  if (parking.has_security_guard) badges.push('Security')
  if (parking.parking_type) badges.push(parking.parking_type)

  const photo = parking.thumbnail_url ?? parking.images?.[0]?.url

  return (
    <div className="group bg-surface rounded-xl border border-line overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-40 relative overflow-hidden">
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green to-green-light flex items-center justify-center">
            <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h5.25m-5.25 0v2.25m0-2.25L12 5.291A2.25 2.25 0 0 1 13.893 4.5h2.357c.82 0 1.573.452 1.961 1.175L20.25 9.75" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-ink truncate">{parking.title}</h3>
            <p className="text-sm text-ink/50 truncate mt-0.5">{parking.address}</p>
          </div>
          <VacancyGauge capacity={parking.total_spaces} vacancy={parking.available_spaces} size="sm" />
        </div>

        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span key={b} className="text-xs bg-concrete px-2 py-0.5 rounded-md text-ink/60">{b}</span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-green">
            ₹{parking.price_per_month.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-ink/40">/mo</span>
          </p>

          {variant === 'user' && (
            <Link
              to={`/parking/${parking.id}`}
              className="text-sm font-medium text-green hover:text-green-light transition-colors"
            >
              View Details →
            </Link>
          )}

          {variant === 'owner' && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-concrete transition-colors"
                aria-label="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/5 transition-colors"
                aria-label="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ParkingCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden animate-pulse">
      <div className="h-40 bg-concrete" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 bg-concrete rounded" />
            <div className="h-3 w-1/2 bg-concrete rounded" />
          </div>
          <div className="h-12 w-12 bg-concrete rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-concrete rounded-md" />
          <div className="h-5 w-16 bg-concrete rounded-md" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 w-20 bg-concrete rounded" />
          <div className="h-4 w-24 bg-concrete rounded" />
        </div>
      </div>
    </div>
  )
}
