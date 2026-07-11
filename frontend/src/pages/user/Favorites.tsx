import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, ShieldCheck, Star } from 'lucide-react'
import { getFavorites, type FavoriteParking } from '../../api/user.api'
import { useFavoritesStore } from '../../store/favoritesStore'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import NotificationBell from '../../components/common/NotificationBell'
import FavoriteButton from '../../components/common/FavoriteButton'
import { ParkingCardSkeleton } from '../../components/common/ParkingCard'

export default function Favorites() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<FavoriteParking[]>([])
  const [loading, setLoading] = useState(true)
  const ids = useFavoritesStore((s) => s.ids)

  useEffect(() => {
    setLoading(true)
    getFavorites()
      .then((favs) => {
        setFavorites(favs)
        // Seed the shared store from this authoritative fetch so per-card
        // FavoriteButtons on this page reflect state without a second request.
        useFavoritesStore.setState({ ids: new Set(favs.map((f) => f.id)), loaded: true })
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false))
  }, [])

  // Drop cards the store no longer considers favorited (e.g. unfavorited via the heart below).
  const visible = favorites.filter((f) => ids.has(f.id))

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Favorites</h1>
          <p className="text-sm text-ink/50 mt-1">Parking spots you've saved for later.</p>
        </div>
        <NotificationBell />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => <ParkingCardSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-16 h-16" strokeWidth={1} />}
          title="No favorites yet"
          description="Save parking spots you like to find them here later."
          actionLabel="Find Parking"
          onAction={() => navigate('/find-parking')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {visible.map((p) => (
            <div key={p.favorite_id} className="bg-surface rounded-xl border border-line overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-navy to-navy-light overflow-hidden">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-bold text-white/25 text-5xl">P</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-600">
                  <ShieldCheck size={12} /> Verified
                </span>
                <FavoriteButton listingId={p.id} className="absolute top-3 right-3" />
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
                </p>

                <div className="mt-4 pt-4 border-t border-line flex items-end justify-between">
                  <div>
                    <p className="text-xs text-ink/40">Monthly Price</p>
                    <p className="font-display text-lg font-bold text-ink">₹{Number(p.price_per_month).toLocaleString('en-IN')}</p>
                  </div>
                  <Link to={`/parking/${p.id}`}>
                    <Button>View Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
