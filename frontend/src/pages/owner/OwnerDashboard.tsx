import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import ParkingCard, { ParkingCardSkeleton } from '../../components/common/ParkingCard'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Button from '../../components/common/Button'
import { getOwnerParkings, deleteParking, type Parking } from '../../api/parkings.api'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const [parkings, setParkings] = useState<Parking[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Parking | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getOwnerParkings()
      .then(setParkings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteParking(deleteTarget.id)
      setParkings((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  const totalSpots = parkings.reduce((s, p) => s + p.capacity, 0)
  const totalVacant = parkings.reduce((s, p) => s + p.vacancy, 0)
  const avgPrice = parkings.length > 0
    ? Math.round(parkings.reduce((s, p) => s + p.monthly_price, 0) / parkings.length)
    : 0

  const stats = [
    { label: 'Listings', value: parkings.length },
    { label: 'Total Spots', value: totalSpots },
    { label: 'Available', value: totalVacant },
    { label: 'Avg Price', value: `₹${avgPrice.toLocaleString('en-IN')}` },
  ]

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Your Parkings</h1>
            <p className="text-sm text-ink/50 mt-1">Manage your parking listings</p>
          </div>
          <Button onClick={() => navigate('/owner/parkings/new')}>Add Parking</Button>
        </div>

        {!loading && parkings.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-line p-4">
                <p className="text-sm text-ink/50">{s.label}</p>
                <p className="font-display text-xl font-semibold text-navy mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => <ParkingCardSkeleton key={i} />)}
          </div>
        ) : parkings.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
            title="No parkings yet"
            description="Add your first parking location and start earning from your empty spaces."
            actionLabel="Add your first parking"
            onAction={() => navigate('/owner/parkings/new')}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkings.map((p) => (
              <ParkingCard
                key={p.id}
                parking={p}
                variant="owner"
                onEdit={() => navigate(`/owner/parkings/${p.id}/edit`)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete parking"
        message={`Delete "${deleteTarget?.title}"? This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
