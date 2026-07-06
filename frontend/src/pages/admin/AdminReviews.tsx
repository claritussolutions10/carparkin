import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Star, Trash2, ShieldCheck } from 'lucide-react'
import { getAdminReviews, deleteAdminReview, type AdminReview } from '../../api/admin.api'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const RATING_OPTIONS = [
  { value: '2', label: '2 Stars & Below' },
  { value: '3', label: '3 Stars & Below' },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
      ))}
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [maxRating, setMaxRating] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminReviews({ search: search || undefined, maxRating: maxRating ? Number(maxRating) : undefined, page, limit })
      .then((d) => { setReviews(d.reviews); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, maxRating, page])
  useEffect(() => { setPage(1) }, [search, maxRating])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminReview(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch { /* keep dialog open on failure */ } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Reviews</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Reviews Moderation</h1>
        <p className="text-sm text-ink/50 mt-1">Browse renter reviews and remove ones that violate content guidelines.</p>
      </div>

      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by reviewer, listing, or review text..." className="flex-1 min-w-[220px]" />
        <Select value={maxRating} onChange={(e) => setMaxRating(e.target.value)} placeholder="All Ratings" options={RATING_OPTIONS} />
        <span className="ml-auto text-sm text-ink/40">{total} review{total === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-line py-16 text-center">
          <Star size={32} className="text-ink/20 mx-auto mb-3" />
          <p className="text-ink/40 text-sm">No reviews match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Stars rating={r.rating} />
                    {r.is_verified_booking && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
                        <ShieldCheck size={12} /> Verified Booking
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-ink">
                    {r.reviewer_name} <span className="text-ink/40 font-normal">on</span>{' '}
                    <Link to={`/parking/${r.listing_id}`} className="text-navy hover:text-green transition-colors">{r.listing_title}</Link>
                  </p>
                  {r.review_text && <p className="text-sm text-ink/70 mt-1.5">{r.review_text}</p>}
                  <p className="text-xs text-ink/40 mt-1.5">{fmtDate(r.created_at)}</p>
                </div>
                <button
                  onClick={() => setDeleteTarget(r)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
        <p className="text-sm text-ink/40">
          {total === 0 ? 'No reviews' : `Showing ${rangeStart} to ${rangeEnd} of ${total} reviews`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Review"
        message={`Permanently remove this review by ${deleteTarget?.reviewer_name}? The listing's rating will be recalculated. This cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
