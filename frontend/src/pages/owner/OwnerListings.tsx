import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, MapPin, Users } from 'lucide-react'
import { getOwnerParkings, deleteParking, type OwnerParking } from '../../api/parkings.api'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }

export default function OwnerListings() {
  const navigate = useNavigate()
  const [parkings, setParkings] = useState<OwnerParking[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<OwnerParking | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getOwnerParkings().then(setParkings).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteParking(deleteTarget.id)
      setParkings((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Listings</h1>
          <p className="text-sm text-ink/50 mt-1">{parkings.length} parking location{parkings.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => navigate('/owner/locations/new')}>
          <Plus size={16} /> Add Listing
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-48 bg-surface rounded-xl border border-line animate-pulse" />
          ))}
        </div>
      ) : parkings.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-12 h-12" />}
          title="No listings yet"
          description="Add your first parking location and start earning."
          actionLabel="Add listing"
          onAction={() => navigate('/owner/locations/new')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parkings.map((p) => (
            <div key={p.id} className="bg-surface rounded-xl border border-line overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-green to-green-light flex items-center justify-center overflow-hidden">
                {p.images?.[0]?.url ? (
                  <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MapPin size={32} className="text-white/30" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-ink truncate">{p.title}</h3>
                  <Badge status={!p.is_approved ? 'pending' : p.is_active ? 'active' : 'inactive'} />
                </div>
                <p className="text-xs text-ink/50 mt-1 truncate">{p.address}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-ink/60">{p.available_spaces}/{p.total_spaces} free</span>
                  <span className="font-medium text-green">{fmt(p.price_per_month)}/mo</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-line">
                  <Link
                    to={`/owner/locations/${p.id}/members`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/70 hover:bg-concrete py-1.5 rounded-lg transition-colors"
                  >
                    <Users size={12} /> Members
                  </Link>
                  <button onClick={() => navigate(`/owner/parkings/${p.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green hover:bg-concrete py-1.5 rounded-lg transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(p)}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-danger hover:bg-danger/5 px-3 py-1.5 rounded-lg transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete listing"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
