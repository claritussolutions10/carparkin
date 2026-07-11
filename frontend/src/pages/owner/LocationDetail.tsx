import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Search, Plus, Phone, Mail, MoreVertical, Car,
} from 'lucide-react'
import { getOwnerParking } from '../../api/parkings.api'
import { getOwnerBookings, type Booking } from '../../api/owner.api'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'

const PAGE_SIZE = 8

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
]

// The schema has no plan-tier concept ("Monthly Premium" etc.) — only a real
// duration_type (day/week/month). Filtering by the real dimension instead of
// fabricating tier names.
const PLAN_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
]

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

type MemberStatus = 'active' | 'expired' | 'pending'

function deriveStatus(b: Booking): MemberStatus {
  if (b.status === 'pending') return 'pending'
  if (b.status === 'cancelled' || b.status === 'completed') return 'expired'
  // confirmed
  return new Date(b.booking_end_date) >= new Date() ? 'active' : 'expired'
}

const STATUS_PILL: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', className: 'bg-red-100 text-danger' },
  pending: { label: 'Pending', className: 'bg-amber/10 text-amber-700' },
}

function planLabel(durationType: string) {
  if (durationType === 'month') return 'Monthly Plan'
  if (durationType === 'week') return 'Weekly Plan'
  if (durationType === 'day') return 'Daily Plan'
  return durationType
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>()
  const [locationName, setLocationName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [page, setPage] = useState(1)
  const [historyTarget, setHistoryTarget] = useState<string | null>(null)
  const [addCarOpen, setAddCarOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getOwnerParking(id).catch(() => null),
      getOwnerBookings({ listingId: id, limit: 200 }),
    ])
      .then(([parking, bookingsRes]) => {
        if (parking) setLocationName(parking.title)
        setBookings(bookingsRes.bookings)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { setPage(1) }, [search, statusFilter, planFilter])

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter && deriveStatus(b) !== statusFilter) return false
      if (planFilter && b.duration_type !== planFilter) return false
      if (historyTarget && b.user_name !== historyTarget) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = [b.registration_number, b.user_name].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [bookings, statusFilter, planFilter, search, historyTarget])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 flex-wrap mb-4">
        <Link to="/owner/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <Link to="/owner/locations" className="hover:text-green transition-colors">Locations</Link>
        <ChevronRight size={12} />
        <span className="text-ink/60 font-medium">{locationName || '...'}</span>
      </nav>

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Cars & Members</h1>
          <p className="text-sm text-ink/50 mt-1">
            Overview of current registered vehicles and active memberships for <span className="font-semibold text-ink">{locationName || 'this location'}</span>.
          </p>
        </div>
        <button
          onClick={() => setAddCarOpen(true)}
          className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0"
        >
          <Plus size={16} /> Add New Car
        </button>
      </div>

      {historyTarget && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-blue-100 text-blue-700 rounded-lg px-4 py-2.5 text-sm">
          <span>Showing full history for <strong>{historyTarget}</strong> at this location.</span>
          <button onClick={() => setHistoryTarget(null)} className="font-medium hover:underline shrink-0">Clear</button>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="bg-surface rounded-xl border border-line p-3 flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by car number or member name..."
            className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
        <Select options={STATUS_OPTIONS} placeholder="All Statuses" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Select options={PLAN_OPTIONS} placeholder="All Plans" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 bg-surface rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line py-16 text-center text-sm text-ink/40">
          No members found.
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Car Details</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Holder Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Plan</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((b) => {
                    const status = deriveStatus(b)
                    const pill = STATUS_PILL[status]
                    return (
                      <tr key={b.id}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-concrete flex items-center justify-center shrink-0">
                              <Car size={16} className="text-ink/40" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-ink">{b.registration_number ?? '—'}</p>
                              <p className="text-xs text-ink/50 mt-0.5">
                                {[b.make, b.model].filter(Boolean).join(' ') || 'Unknown vehicle'}
                                {b.color ? ` • ${b.color}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-medium flex items-center justify-center shrink-0">
                              {b.user_name?.[0] ?? '?'}
                            </div>
                            <div>
                              <p className="font-medium text-ink">{b.user_name}</p>
                              <p className="text-xs text-ink/40 mt-0.5">Member since {fmtDate(b.booking_start_date)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-ink">{planLabel(b.duration_type)}</p>
                          <p className="text-xs text-ink/40 mt-0.5">Expires: {fmtDate(b.booking_end_date)}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pill.className}`}>{pill.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 relative">
                            <a
                              href={b.user_phone ? `tel:${b.user_phone}` : undefined}
                              className={`p-2 rounded-lg transition-colors ${b.user_phone ? 'text-ink/50 hover:text-green hover:bg-concrete' : 'text-ink/20 pointer-events-none'}`}
                              aria-label="Call holder"
                            >
                              <Phone size={15} />
                            </a>
                            <a
                              href={b.user_email ? `mailto:${b.user_email}` : undefined}
                              className={`p-2 rounded-lg transition-colors ${b.user_email ? 'text-ink/50 hover:text-green hover:bg-concrete' : 'text-ink/20 pointer-events-none'}`}
                              aria-label="Email holder"
                            >
                              <Mail size={15} />
                            </a>
                            <button
                              onClick={() => setOpenMenuId((v) => (v === b.id ? null : b.id))}
                              className="p-2 rounded-lg text-ink/50 hover:text-ink hover:bg-concrete transition-colors"
                              aria-label="More actions"
                            >
                              <MoreVertical size={15} />
                            </button>
                            {openMenuId === b.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-9 z-20 bg-surface rounded-lg border border-line shadow-lg py-1 w-44">
                                  <button
                                    onClick={() => { setHistoryTarget(b.user_name ?? null); setOpenMenuId(null) }}
                                    className="w-full text-left px-3 py-2 text-sm text-ink/70 hover:bg-concrete transition-colors"
                                  >
                                    View Full History
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 flex-wrap mt-5">
            <p className="text-sm text-ink/40">Showing {rangeStart} to {rangeEnd} of {filtered.length} results</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink/60 disabled:opacity-40 hover:bg-concrete transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                    page === p ? 'bg-green text-white border-green' : 'bg-surface border-line text-ink/60 hover:bg-concrete hover:border-green/40'
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
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer line */}
      <p className="text-center text-sm text-ink/50 mt-10">
        Need help managing your members? <Link to="/owner/settings" className="text-green hover:text-green-light font-medium transition-colors">View Owner's Guide</Link>
      </p>

      <Modal open={addCarOpen} onClose={() => setAddCarOpen(false)} title="Add New Car">
        <p className="text-sm text-ink/60 leading-relaxed">
          Owners can't register a vehicle directly yet — drivers add their own car when they book a spot at your
          location, and it will appear here automatically once their booking is confirmed.
        </p>
        <div className="flex justify-end pt-4">
          <button onClick={() => setAddCarOpen(false)} className="bg-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-light transition-colors">
            Got it
          </button>
        </div>
      </Modal>
    </div>
  )
}
