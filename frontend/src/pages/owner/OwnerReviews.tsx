import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Star, ShieldCheck, MessageSquare } from 'lucide-react'
import { getOwnerReviews, replyOwnerReview, type OwnerReview, type OwnerReviewStats } from '../../api/owner.api'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
      ))}
    </div>
  )
}

export default function OwnerReviews() {
  const [reviews, setReviews] = useState<OwnerReview[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<OwnerReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 10

  const [replyTarget, setReplyTarget] = useState<OwnerReview | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  const load = () => {
    setLoading(true)
    getOwnerReviews({ page, limit })
      .then((d) => { setReviews(d.reviews); setTotal(d.total); setStats(d.stats) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const totalPages = Math.ceil(total / limit)

  const openReply = (r: OwnerReview) => { setReplyTarget(r); setReplyText(r.owner_reply ?? '') }

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyTarget || !replyText.trim()) return
    setReplySaving(true)
    try {
      await replyOwnerReview(replyTarget.id, replyText.trim())
      setReplyTarget(null)
      load()
    } catch { /* keep modal open on failure */ } finally {
      setReplySaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/owner/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Reviews</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Reviews</h1>
        <p className="text-sm text-ink/50 mt-1">What renters are saying about your locations, and your replies.</p>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <p className="text-sm text-ink/50">Average Rating</p>
            <p className="font-display text-2xl font-semibold text-ink mt-1 flex items-center gap-1.5">
              {stats.averageRating.toFixed(1)} <Star size={16} className="fill-amber-400 text-amber-400" />
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <p className="text-sm text-ink/50">Total Reviews</p>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.total}</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <p className="text-sm text-ink/50">Awaiting Reply</p>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.unreplied}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 bg-surface rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line py-16 text-center">
          <MessageSquare size={32} className="text-ink/20 mx-auto mb-3" />
          <p className="text-ink/40 text-sm">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-surface rounded-xl border border-line p-5">
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
                    <Link to={`/parking/${r.listing_id}`} className="text-ink hover:text-green transition-colors">{r.listing_title}</Link>
                  </p>
                  {r.review_text && <p className="text-sm text-ink/70 mt-1.5">{r.review_text}</p>}
                  <p className="text-xs text-ink/40 mt-1.5">{fmtDate(r.created_at)}</p>
                  {r.owner_reply && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <p className="text-xs font-semibold text-green mb-1">Your reply:</p>
                      <p className="text-sm text-ink/70">{r.owner_reply}</p>
                    </div>
                  )}
                </div>
                <Button variant={r.owner_reply ? 'secondary' : 'primary'} onClick={() => openReply(r)} className="shrink-0">
                  {r.owner_reply ? 'Edit Reply' : 'Reply'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to Review">
        {replyTarget && (
          <form onSubmit={submitReply} className="space-y-4">
            <div className="rounded-lg bg-concrete p-3">
              <p className="text-xs text-ink/40 mb-1">{replyTarget.reviewer_name} wrote:</p>
              <p className="text-sm text-ink/70">{replyTarget.review_text || '(no written comment)'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Your Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                required
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setReplyTarget(null)}>Cancel</Button>
              <Button type="submit" loading={replySaving}>Post Reply</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
