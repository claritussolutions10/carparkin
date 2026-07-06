import { useEffect, useMemo, useState } from 'react'
import {
  Search, Phone, Mail, ChevronLeft, ChevronRight, Car, Clock, IndianRupee,
  Download, MoreVertical,
} from 'lucide-react'
import { getOwnerBookings, getOwnerDashboard, getMonthlyEarnings, type Booking } from '../../api/owner.api'
import { getOwnerParkings, type OwnerParking } from '../../api/parkings.api'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'

const PAGE_SIZE = 8

type MemberStatus = 'active' | 'expiring' | 'pending' | 'expired'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
]

const STATUS_PILL: Record<MemberStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  expiring: { label: 'Expiring', className: 'bg-amber/10 text-amber-700' },
  pending: { label: 'Pending', className: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', className: 'bg-concrete text-ink/50' },
}

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function fmtShortDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
function fmtMonthLabel(d: Date) { return d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase() }

function deriveStatus(b: Booking): MemberStatus {
  if (b.status === 'pending') return 'pending'
  if (b.status === 'cancelled' || b.status === 'completed') return 'expired'
  // confirmed
  const end = new Date(b.booking_end_date)
  const now = new Date()
  if (end < now) return 'expired'
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  return daysUntilEnd <= 7 ? 'expiring' : 'active'
}

function durationCaption(b: Booking, status: MemberStatus) {
  if (status === 'pending') return { text: 'Upcoming', tone: 'text-ink/40' }
  if (status === 'expired') return { text: 'Ended', tone: 'text-ink/30' }
  if (status === 'expiring') {
    const days = Math.max(0, Math.ceil((new Date(b.booking_end_date).getTime() - Date.now()) / 86400000))
    return { text: `Expires in ${days} day${days === 1 ? '' : 's'}`, tone: 'text-amber-700 font-medium' }
  }
  return { text: `${b.duration_days} Days`, tone: 'text-ink/40' }
}

function downloadCsv(rows: Booking[]) {
  const header = ['Car Number', 'Member Name', 'Location', 'Start', 'End', 'Amount', 'Status']
  const lines = rows.map((b) => [
    b.registration_number ?? '', b.user_name ?? '', b.listing_title ?? '',
    b.booking_start_date, b.booking_end_date, b.total_price, deriveStatus(b),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [locations, setLocations] = useState<OwnerParking[]>([])
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0)
  const [lastMonthRevenue, setLastMonthRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [page, setPage] = useState(1)

  const [detailsTarget, setDetailsTarget] = useState<Booking | null>(null)
  const [cancelStubTarget, setCancelStubTarget] = useState<Booking | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getOwnerBookings({ limit: 200 }),
      getOwnerParkings(),
      getOwnerDashboard(),
      getMonthlyEarnings(2),
    ])
      .then(([bookingsRes, parkings, dash, monthly]) => {
        setBookings(bookingsRes.bookings)
        setLocations(parkings)
        setThisMonthRevenue(dash.earnings.thisMonth)
        const sorted = [...monthly].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
        setLastMonthRevenue(sorted[1] ? Number(sorted[1].net_amount) : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setPage(1) }, [search, statusFilter, locationFilter])

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter && deriveStatus(b) !== statusFilter) return false
      if (locationFilter && b.listing_id !== locationFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = [b.registration_number, b.user_name].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [bookings, statusFilter, locationFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  const activeCount = useMemo(() => bookings.filter((b) => {
    const s = deriveStatus(b)
    return s === 'active' || s === 'expiring'
  }).length, [bookings])
  const expiringCount = useMemo(() => bookings.filter((b) => deriveStatus(b) === 'expiring').length, [bookings])
  const distinctLocations = useMemo(() => new Set(bookings.map((b) => b.listing_id).filter(Boolean)).size, [bookings])

  const locationOptions = locations.map((l) => ({ value: l.id, label: l.title }))

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">All Bookings</h1>
          <p className="text-sm text-ink/50 mt-1">View and manage all monthly parking commitments across your properties.</p>
        </div>
        <button
          onClick={() => downloadCsv(filtered)}
          className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0"
        >
          <Download size={16} /> Export Data
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-line p-5">
          <div className="flex items-center gap-2 text-ink/40">
            <Car size={14} />
            <p className="text-xs font-semibold uppercase tracking-wide">Active Bookings</p>
          </div>
          <p className="font-display text-2xl font-bold text-ink mt-2">{activeCount}</p>
          <p className="text-xs text-ink/40 mt-1">Across {distinctLocations} location{distinctLocations === 1 ? '' : 's'}</p>
        </div>
        <div className="bg-white rounded-xl border border-line p-5">
          <div className="flex items-center gap-2 text-ink/40">
            <Clock size={14} />
            <p className="text-xs font-semibold uppercase tracking-wide">Expiring Soon</p>
          </div>
          <p className="font-display text-2xl font-bold text-ink mt-2">{expiringCount}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Within next 7 days</p>
        </div>
        <div className="bg-white rounded-xl border border-line p-5">
          <div className="flex items-center gap-2 text-ink/40">
            <IndianRupee size={14} />
            <p className="text-xs font-semibold uppercase tracking-wide">Revenue ({fmtMonthLabel(new Date())})</p>
          </div>
          <p className="font-display text-2xl font-bold text-ink mt-2">{fmt(thisMonthRevenue)}</p>
          <p className="text-xs text-ink/40 mt-1">{lastMonthRevenue != null ? `${fmt(lastMonthRevenue)} last month` : 'No prior month data'}</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="bg-white rounded-xl border border-line p-3 flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Car Number or Member Name"
            className="w-full rounded-lg border border-line pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
        <Select options={STATUS_OPTIONS} placeholder="Status: All" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Select options={locationOptions} placeholder="Location: All" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-line py-16 text-center text-sm text-ink/40">
          No bookings found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Car Number</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Member Name</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Location</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Period</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Amount</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((b) => {
                    const status = deriveStatus(b)
                    const pill = STATUS_PILL[status]
                    const caption = durationCaption(b, status)
                    return (
                      <tr key={b.id}>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-concrete flex items-center justify-center shrink-0">
                              <Car size={16} className="text-ink/40" />
                            </div>
                            <p className="font-mono font-semibold text-ink">{b.registration_number ?? '—'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink font-medium whitespace-nowrap">{b.user_name}</td>
                        <td className="px-5 py-4 text-ink/70 whitespace-nowrap">{b.listing_title}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-ink">{fmtShortDate(b.booking_start_date)} - {fmtDate(b.booking_end_date)}</p>
                          <p className={`text-xs mt-0.5 ${caption.tone}`}>{caption.text}</p>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-ink whitespace-nowrap">{fmt(b.total_price)}</td>
                        <td className="px-5 py-4 text-right">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${pill.className}`}>{pill.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end relative">
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
                                <div className="absolute right-0 top-9 z-20 bg-white rounded-lg border border-line shadow-lg py-1 w-48">
                                  <button
                                    onClick={() => { setDetailsTarget(b); setOpenMenuId(null) }}
                                    className="w-full text-left px-3 py-2 text-sm text-ink/70 hover:bg-concrete transition-colors"
                                  >
                                    View Details
                                  </button>
                                  <a
                                    href={b.user_email ? `mailto:${b.user_email}?subject=${encodeURIComponent(`Reminder: your booking at ${b.listing_title ?? 'our location'}`)}&body=${encodeURIComponent(`Hi ${b.user_name ?? ''},\n\nThis is a reminder about your parking booking ending ${fmtDate(b.booking_end_date)}.`)}` : undefined}
                                    onClick={() => setOpenMenuId(null)}
                                    className={`block w-full text-left px-3 py-2 text-sm transition-colors ${b.user_email ? 'text-ink/70 hover:bg-concrete' : 'text-ink/30 pointer-events-none'}`}
                                  >
                                    Send Reminder
                                  </a>
                                  <button
                                    onClick={() => { setCancelStubTarget(b); setOpenMenuId(null) }}
                                    className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                                  >
                                    Cancel Booking
                                  </button>
                                  <div className="border-t border-line my-1" />
                                  <a
                                    href={b.user_phone ? `tel:${b.user_phone}` : undefined}
                                    onClick={() => setOpenMenuId(null)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${b.user_phone ? 'text-ink/70 hover:bg-concrete' : 'text-ink/30 pointer-events-none'}`}
                                  >
                                    <Phone size={13} /> Call Member
                                  </a>
                                  <a
                                    href={b.user_email ? `mailto:${b.user_email}` : undefined}
                                    onClick={() => setOpenMenuId(null)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${b.user_email ? 'text-ink/70 hover:bg-concrete' : 'text-ink/30 pointer-events-none'}`}
                                  >
                                    <Mail size={13} /> Email Member
                                  </a>
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
            <p className="text-sm text-ink/40">Showing {rangeStart} to {rangeEnd} of {filtered.length} entries</p>
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
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Details modal */}
      <Modal open={!!detailsTarget} onClose={() => setDetailsTarget(null)} title="Booking Details">
        {detailsTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-ink/50">Member</span><span className="text-ink font-medium text-right">{detailsTarget.user_name}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Car</span><span className="text-ink text-right">{[detailsTarget.make, detailsTarget.model].filter(Boolean).join(' ') || '—'} <span className="font-mono">{detailsTarget.registration_number}</span></span></div>
            <div className="flex justify-between"><span className="text-ink/50">Location</span><span className="text-ink text-right">{detailsTarget.listing_title}</span></div>
            <div className="flex justify-between"><span className="text-ink/50">Period</span><span className="text-ink text-right">{fmtDate(detailsTarget.booking_start_date)} → {fmtDate(detailsTarget.booking_end_date)}</span></div>
            <div className="flex justify-between pt-3 border-t border-line"><span className="text-ink/50">Total</span><span className="font-mono font-semibold text-ink text-right">{fmt(detailsTarget.total_price)}</span></div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking stub */}
      <Modal open={!!cancelStubTarget} onClose={() => setCancelStubTarget(null)} title="Cancel Booking">
        <p className="text-sm text-ink/60 leading-relaxed">
          Owners can't cancel a member's booking directly yet — a driver's booking can currently only be cancelled by
          the driver themselves from their own account. Contact {cancelStubTarget?.user_name ?? 'the member'} directly if this booking needs to end early.
        </p>
        <div className="flex justify-end pt-4">
          <button onClick={() => setCancelStubTarget(null)} className="bg-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-light transition-colors">
            Got it
          </button>
        </div>
      </Modal>
    </div>
  )
}
