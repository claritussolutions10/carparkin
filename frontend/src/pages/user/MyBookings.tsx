import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, MapPin, Car, Clock, Building2, Ban, ChevronLeft, ChevronRight, Star,
} from 'lucide-react'
import {
  getUserBookings, cancelUserBooking, getUserBookingById, writeReview, type UserBooking,
} from '../../api/user.api'
import { accessCode } from '../../lib/bookingHelpers'
import { downloadInvoicePdf } from '../../lib/invoicePdf'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import NotificationBell from '../../components/common/NotificationBell'

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Bookings' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const PLAN_LABELS: Record<string, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly' }

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function planLabel(t: string) { return PLAN_LABELS[t] ?? (t ? t[0].toUpperCase() + t.slice(1) : 'Plan') }

type CardVariant = 'active' | 'upcoming' | 'completed' | 'cancelled'

function variantOf(b: UserBooking): CardVariant {
  if (b.status === 'cancelled') return 'cancelled'
  if (b.status === 'completed') return 'completed'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return today >= new Date(b.booking_start_date) ? 'active' : 'upcoming'
}

function progressOf(b: UserBooking) {
  const start = +new Date(b.booking_start_date)
  const end = +new Date(b.booking_end_date)
  const now = Date.now()
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start || 1)) * 100))
  const daysRemaining = Math.max(0, Math.ceil((end - now) / 86400000))
  return { pct, daysRemaining }
}

function StarInput({ value, onChange, size = 22 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n === 1 ? '' : 's'}`}>
          <Star size={size} className={n <= value ? 'text-amber fill-amber' : 'text-line'} />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? 'text-amber fill-amber' : 'text-line'} />
      ))}
    </div>
  )
}

const VARIANT_META: Record<CardVariant, { iconBg: string; iconColor: string; icon: typeof Car; badge: 'green' | 'blue' | 'gray' | 'red'; label: string }> = {
  active: { iconBg: 'bg-green-100', iconColor: 'text-green-700', icon: Car, badge: 'green', label: 'ACTIVE' },
  upcoming: { iconBg: 'bg-blue-100', iconColor: 'text-blue-500', icon: Car, badge: 'blue', label: 'UPCOMING' },
  completed: { iconBg: 'bg-concrete', iconColor: 'text-ink/40', icon: Building2, badge: 'gray', label: 'COMPLETED' },
  cancelled: { iconBg: 'bg-red-100', iconColor: 'text-danger', icon: Ban, badge: 'red', label: 'CANCELLED' },
}

export default function MyBookings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<UserBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<UserBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [passTarget, setPassTarget] = useState<UserBooking | null>(null)
  const [detailsTarget, setDetailsTarget] = useState<{ booking: UserBooking; title: string } | null>(null)

  const [reviewTarget, setReviewTarget] = useState<UserBooking | null>(null)
  const [rating, setRating] = useState(0)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [securityRating, setSecurityRating] = useState(0)
  const [accessibilityRating, setAccessibilityRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const [viewReviewTarget, setViewReviewTarget] = useState<UserBooking | null>(null)
  const [viewReviewLoading, setViewReviewLoading] = useState(false)

  const limit = 6

  useEffect(() => {
    setLoading(true)
    getUserBookings({ limit: 100 })
      .then((d) => setBookings(d.bookings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = bookings
    if (tab === 'active') list = list.filter((b) => b.status === 'pending' || b.status === 'confirmed')
    else if (tab === 'completed') list = list.filter((b) => b.status === 'completed')
    else if (tab === 'cancelled') list = list.filter((b) => b.status === 'cancelled')

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((b) =>
        (b.listing_title ?? '').toLowerCase().includes(q) ||
        (b.listing_address ?? '').toLowerCase().includes(q) ||
        (b.make ?? '').toLowerCase().includes(q) ||
        (b.model ?? '').toLowerCase().includes(q) ||
        (b.registration_number ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [bookings, tab, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const pageItems = filtered.slice((page - 1) * limit, page * limit)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelUserBooking(cancelTarget.id)
      setBookings((prev) => prev.map((b) => (b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b)))
      setCancelTarget(null)
    } catch { /* keep dialog open on failure */ } finally { setCancelling(false) }
  }

  const openReview = (b: UserBooking) => {
    setReviewTarget(b)
    setRating(0); setCleanlinessRating(0); setSecurityRating(0); setAccessibilityRating(0); setReviewText('')
    setReviewError('')
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewTarget) return
    if (rating === 0) { setReviewError('Please select an overall rating.'); return }
    setReviewSaving(true)
    setReviewError('')
    try {
      const review = await writeReview(reviewTarget.id, {
        rating,
        reviewText: reviewText.trim() || undefined,
        cleanlinessRating: cleanlinessRating || undefined,
        securityRating: securityRating || undefined,
        accessibilityRating: accessibilityRating || undefined,
      })
      setBookings((prev) => prev.map((b) => (b.id === reviewTarget.id ? { ...b, review_id: review.id, review_rating: review.rating } : b)))
      setReviewTarget(null)
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Could not submit your review. Please try again.')
    } finally {
      setReviewSaving(false)
    }
  }

  const openViewReview = (b: UserBooking) => {
    setViewReviewTarget(b)
    setViewReviewLoading(true)
    getUserBookingById(b.id)
      .then((full) => setViewReviewTarget(full))
      .catch(() => {})
      .finally(() => setViewReviewLoading(false))
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">My Bookings</h1>
          <p className="text-sm text-ink/50 mt-1">View and manage all your parking reservations.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          <Button onClick={() => navigate('/find-parking')} className="!bg-navy hover:!bg-navy-light">
            <Plus size={16} /> New Booking
          </Button>
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="bg-white rounded-xl border border-line p-3 flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1) }}
              className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                tab === t.key ? 'font-bold text-ink border-b-2 border-ink' : 'font-medium text-ink/50 hover:text-green'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by location or car..."
            className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
      </div>

      {/* Bookings list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-line animate-pulse" />
          ))
        ) : pageItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-line py-16 text-center text-sm text-ink/40">
            No bookings found.
          </div>
        ) : (
          pageItems.map((b) => {
            const variant = variantOf(b)
            const meta = VARIANT_META[variant]
            const Icon = meta.icon

            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4 border ${
                  variant === 'active' ? 'border-line border-l-4 !border-l-green bg-green-50/40' : 'border-line'
                }`}
              >
                {/* Icon + identity */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-ink">{b.listing_title ?? 'Parking'}</p>
                      <Badge label={meta.label} variant={meta.badge} />
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                      <MapPin size={12} className="shrink-0" />
                      {b.listing_address}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.make && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink/70">
                          <Car size={12} /> {b.make} {b.model} · <span className="font-mono">{b.registration_number}</span>
                        </span>
                      )}
                      {(variant === 'active' || variant === 'upcoming') && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink/70">
                          <Clock size={12} /> {planLabel(b.duration_type)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking period */}
                <div className="lg:w-56 shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">Booking Period</p>
                  <p className="text-sm text-ink mt-0.5">{fmtDate(b.booking_start_date)} → {fmtDate(b.booking_end_date)}</p>
                  {variant === 'active' && (() => {
                    const { pct, daysRemaining } = progressOf(b)
                    return (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full bg-line overflow-hidden">
                          <div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-ink/40 mt-1">{daysRemaining} days remaining</p>
                      </div>
                    )
                  })()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 lg:w-auto w-full">
                  {variant === 'active' && (
                    <>
                      <Button variant="secondary" className="flex-1 lg:flex-none" onClick={() => setCancelTarget(b)}>Manage</Button>
                      <Button className="flex-1 lg:flex-none" onClick={() => setPassTarget(b)}>View Pass</Button>
                    </>
                  )}
                  {variant === 'upcoming' && (
                    <Button variant="secondary" className="w-full lg:w-auto" onClick={() => setDetailsTarget({ booking: b, title: 'Booking Details' })}>
                      Details
                    </Button>
                  )}
                  {variant === 'completed' && (
                    <>
                      {b.listing_id && (
                        <Link to={`/parking/${b.listing_id}`} className="flex-1 lg:flex-none flex items-center justify-center text-sm font-medium text-green hover:text-green-light transition-colors">
                          Book Again
                        </Link>
                      )}
                      <Button variant="secondary" className="flex-1 lg:flex-none" onClick={() => setDetailsTarget({ booking: b, title: 'Invoice' })}>
                        Invoice
                      </Button>
                      {b.review_id ? (
                        <Button variant="secondary" className="flex-1 lg:flex-none" onClick={() => openViewReview(b)}>
                          Your Review
                        </Button>
                      ) : (
                        <Button className="flex-1 lg:flex-none" onClick={() => openReview(b)}>
                          Write a Review
                        </Button>
                      )}
                    </>
                  )}
                  {variant === 'cancelled' && (
                    <Button variant="secondary" className="w-full lg:w-auto" onClick={() => setDetailsTarget({ booking: b, title: 'Booking Details' })}>
                      Details
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink/60 disabled:opacity-40 hover:bg-concrete transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-green text-white border-green' : 'bg-white border-line text-ink/60 hover:bg-concrete hover:border-green/40'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink/60 disabled:opacity-40 hover:bg-concrete transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel booking"
        message="Are you sure you want to cancel this booking? This cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={cancelling}
      />

      <Modal open={!!passTarget} onClose={() => setPassTarget(null)} title="Digital Pass">
        {passTarget && (
          <div className="text-center">
            <div className="bg-concrete rounded-xl py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Access Code</p>
              <p className="font-mono text-3xl font-bold text-ink mt-1">{accessCode(passTarget.id)}</p>
            </div>
            <p className="mt-4 font-display font-semibold text-ink">{passTarget.listing_title}</p>
            <p className="text-sm text-ink/50 mt-1">{passTarget.listing_address}</p>
            {passTarget.make && (
              <p className="text-sm text-ink/50 mt-2">{passTarget.make} {passTarget.model} · <span className="font-mono">{passTarget.registration_number}</span></p>
            )}
            <p className="text-xs text-ink/40 mt-3">Valid {fmtDate(passTarget.booking_start_date)} → {fmtDate(passTarget.booking_end_date)}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!detailsTarget} onClose={() => setDetailsTarget(null)} title={detailsTarget?.title ?? 'Booking Details'}>
        {detailsTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink/50">Listing</span><span className="text-ink font-medium text-right">{detailsTarget.booking.listing_title}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Address</span><span className="text-ink text-right">{detailsTarget.booking.listing_address}</span></div>
            {detailsTarget.booking.make && (
              <div className="flex justify-between"><span className="text-ink/50">Vehicle</span><span className="text-ink text-right">{detailsTarget.booking.make} {detailsTarget.booking.model} · <span className="font-mono">{detailsTarget.booking.registration_number}</span></span></div>
            )}
            <div className="flex justify-between"><span className="text-ink/50">Plan</span><span className="text-ink text-right">{planLabel(detailsTarget.booking.duration_type)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Period</span><span className="text-ink text-right">{fmtDate(detailsTarget.booking.booking_start_date)} → {fmtDate(detailsTarget.booking.booking_end_date)}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Payment Status</span><Badge status={detailsTarget.booking.payment_status} /></div>
            <div className="flex justify-between pt-3 border-t border-line"><span className="text-ink/50">Total</span><span className="font-mono font-semibold text-ink text-right">{fmt(detailsTarget.booking.total_price)}</span></div>
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => downloadInvoicePdf(detailsTarget.booking, user?.full_name ?? 'Customer')}
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Write a Review">
        {reviewTarget && (
          <form onSubmit={submitReview} className="space-y-5">
            <div>
              <p className="text-sm font-medium text-ink">{reviewTarget.listing_title}</p>
              <p className="text-xs text-ink/50">{reviewTarget.listing_address}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Overall Rating *</label>
              <StarInput value={rating} onChange={setRating} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-ink/50 mb-1">Cleanliness</label>
                <StarInput value={cleanlinessRating} onChange={setCleanlinessRating} size={16} />
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">Security</label>
                <StarInput value={securityRating} onChange={setSecurityRating} size={16} />
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">Accessibility</label>
                <StarInput value={accessibilityRating} onChange={setAccessibilityRating} size={16} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Your Review (optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value.slice(0, 1000))}
                rows={4}
                placeholder="How was your experience with this parking spot?"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green resize-none"
              />
            </div>

            {reviewError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{reviewError}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setReviewTarget(null)} disabled={reviewSaving}>Cancel</Button>
              <Button type="submit" loading={reviewSaving}>Submit Review</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!viewReviewTarget} onClose={() => setViewReviewTarget(null)} title="Your Review">
        {viewReviewLoading ? (
          <div className="h-32 bg-concrete rounded-lg animate-pulse" />
        ) : viewReviewTarget && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-ink">{viewReviewTarget.listing_title}</p>
              <p className="text-xs text-ink/50">{viewReviewTarget.listing_address}</p>
            </div>
            <StarDisplay value={viewReviewTarget.review_rating ?? 0} size={18} />
            {viewReviewTarget.review_text && (
              <p className="text-sm text-ink/70">{viewReviewTarget.review_text}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
