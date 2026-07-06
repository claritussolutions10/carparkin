import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Plus, Download, Eye, Check, Ban, X, Car, Bike, Calendar,
} from 'lucide-react'
import {
  getAdminBookings, getAdminBookingStats, updateAdminBookingStatus, getAdminListingOptions,
  type AdminBooking, type BookingStats, type AdminListingOption,
} from '../../api/admin.api'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }

function BookingStatCard({ label, value, caption, trend, trendTone }: { label: string; value: string; caption: string; trend: number | null; trendTone: 'green' | 'amber' }) {
  const positive = trend !== null && trend >= 0
  const pillClass = trend === null ? '' : positive
    ? (trendTone === 'green' ? 'bg-green-100 text-green-700' : 'bg-amber/20 text-amber-700')
    : 'bg-danger/10 text-danger'
  return (
    <div className="bg-white rounded-xl border border-line p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink/50">{label}</p>
        {trend !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${pillClass}`}>{positive ? '+' : ''}{trend}%</span>
        )}
      </div>
      <p className="font-display text-2xl font-semibold text-navy mt-1">{value}</p>
      <p className="text-xs text-ink/40 mt-1">{caption}</p>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const DATE_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
]

function dateRange(preset: string): { dateFrom?: string; dateTo?: string } {
  if (!preset) return {}
  const now = new Date()
  if (preset === 'this-month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { dateFrom: from.toISOString().slice(0, 10) }
  }
  if (preset === 'last-month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0)
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) }
  }
  const from = new Date()
  from.setDate(from.getDate() - Number(preset))
  return { dateFrom: from.toISOString().slice(0, 10) }
}

function statusLabel(status: string) {
  if (status === 'confirmed') return 'Active'
  if (status === 'pending') return 'Pending'
  if (status === 'completed') return 'Completed'
  return 'Cancelled'
}

function statusVariant(status: string): 'green' | 'amber' | 'gray' | 'red' {
  if (status === 'confirmed') return 'green'
  if (status === 'pending') return 'amber'
  if (status === 'completed') return 'gray'
  return 'red'
}

function durationCaption(b: AdminBooking) {
  const expired = b.status === 'confirmed' && new Date(b.booking_end_date) < new Date()
  if (expired) return { text: 'Expired', tone: 'text-amber-700 font-medium' }
  const label = b.duration_type === 'month' ? 'Monthly' : b.duration_type === 'week' ? 'Weekly' : b.duration_type === 'day' ? 'Daily' : b.duration_type
  return { text: label, tone: 'text-ink/40' }
}

function downloadBookingsCsv(rows: AdminBooking[], filename: string) {
  const header = ['ID', 'Customer', 'Plate', 'Location', 'Start', 'End', 'Amount', 'Status']
  const lines = rows.map((b) => [
    b.id, b.user_name, b.registration_number, b.listing_title, b.booking_start_date, b.booking_end_date, b.total_price, statusLabel(b.status),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [locations, setLocations] = useState<AdminListingOption[]>([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [locationId, setLocationId] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [viewTarget, setViewTarget] = useState<AdminBooking | null>(null)
  const [actionTarget, setActionTarget] = useState<{ booking: AdminBooking; action: 'confirmed' | 'cancelled' } | null>(null)
  const [actionSaving, setActionSaving] = useState(false)

  const load = () => {
    setLoading(true)
    const { dateFrom, dateTo } = dateRange(datePreset)
    getAdminBookings({ search: search || undefined, status: status || undefined, locationId: locationId || undefined, dateFrom, dateTo, page, limit })
      .then((d) => { setBookings(d.bookings); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, datePreset, locationId, page])
  useEffect(() => { setPage(1) }, [search, status, datePreset, locationId])
  useEffect(() => { setSelected(new Set()) }, [bookings])
  useEffect(() => { getAdminBookingStats().then(setStats).catch(() => {}) }, [])
  useEffect(() => { getAdminListingOptions().then(setLocations).catch(() => {}) }, [])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const allSelected = bookings.length > 0 && bookings.every((b) => selected.has(b.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(bookings.map((b) => b.id)))
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const selectedBookings = useMemo(() => bookings.filter((b) => selected.has(b.id)), [bookings, selected])
  const locationOptions = useMemo(() => locations.map((l) => ({ value: l.id, label: l.title })), [locations])

  const confirmAction = async () => {
    if (!actionTarget) return
    setActionSaving(true)
    try {
      await updateAdminBookingStatus(actionTarget.booking.id, actionTarget.action)
      setActionTarget(null)
      load()
    } catch { /* keep dialog open on failure */ } finally {
      setActionSaving(false)
    }
  }

  const confirmBulkApprove = async () => {
    setBulkSaving(true)
    try {
      await Promise.all(selectedBookings.filter((b) => b.status === 'pending').map((b) => updateAdminBookingStatus(b.id, 'confirmed')))
      setBulkApproveOpen(false)
      setSelected(new Set())
      load()
    } catch { /* partial failures still reflected on refetch */ } finally {
      setBulkSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Bookings</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Booking Management</h1>
          <p className="text-sm text-ink/50 mt-1">Manage, track and approve monthly parking reservations.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadBookingsCsv(bookings, `bookings-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-2 border border-line text-ink/70 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-concrete transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            disabled
            title="Bookings are created by users during checkout — there's no standalone admin booking-creation flow yet"
            className="inline-flex items-center gap-2 bg-green/50 text-white font-medium text-sm px-4 py-2.5 rounded-lg cursor-not-allowed"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <BookingStatCard label="Total Active Bookings" value={stats.activeCount.toLocaleString('en-IN')} caption="Current active reservations" trend={stats.trends.active} trendTone="green" />
          <BookingStatCard label="Pending Approval" value={stats.pendingCount.toLocaleString('en-IN')} caption="Requires admin review" trend={stats.trends.pending} trendTone="amber" />
          <BookingStatCard label="Revenue this Month" value={fmt(stats.monthRevenue)} caption="Total processed payments" trend={stats.trends.revenue} trendTone="green" />
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ID, User, or License Plate..." className="flex-1 min-w-[220px]" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status: All" options={STATUS_OPTIONS} />
        <Select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} options={DATE_OPTIONS} />
        <Select value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="Location: All" options={locationOptions} />
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="bg-navy text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadBookingsCsv(selectedBookings, `bookings-selected-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} /> Export Selected
            </button>
            <button
              onClick={() => setBulkApproveOpen(true)}
              disabled={!selectedBookings.some((b) => b.status === 'pending')}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-green hover:bg-green-light disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check size={14} /> Approve Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                </th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Dates</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-10 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-ink/40">No bookings found.</td></tr>
              ) : (
                bookings.map((b) => {
                  const dur = durationCaption(b)
                  const VehicleIcon = b.vehicle_type === 'bike' || b.vehicle_type === 'motorcycle' ? Bike : Car
                  return (
                    <tr key={b.id} className="hover:bg-concrete/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleOne(b.id)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green">{b.id.slice(0, 10)}…</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium shrink-0 overflow-hidden">
                            {b.user_avatar ? <img src={b.user_avatar} alt="" className="w-full h-full object-cover" /> : b.user_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{b.user_name}</p>
                            <p className="text-xs text-ink/40 truncate">{b.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <VehicleIcon size={13} className="text-ink/30 shrink-0" />
                          <span className="font-mono text-xs text-ink/70">{b.registration_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-0">
                        <p className="font-medium text-ink truncate">{b.listing_title}</p>
                        <p className="text-xs text-ink/40 truncate">{b.owner_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-ink/70">
                          <Calendar size={12} className="text-ink/30 shrink-0" />
                          {fmtDate(b.booking_start_date)} - {fmtDate(b.booking_end_date)}
                        </div>
                        <p className={`text-xs mt-0.5 ${dur.tone}`}>{dur.text}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(b.total_price)}</td>
                      <td className="px-4 py-3"><Badge variant={statusVariant(b.status)} label={statusLabel(b.status)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewTarget(b)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="View">
                            <Eye size={15} />
                          </button>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => setActionTarget({ booking: b, action: 'confirmed' })} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="Approve">
                                <Check size={15} />
                              </button>
                              <button onClick={() => setActionTarget({ booking: b, action: 'cancelled' })} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/10 transition-colors" aria-label="Reject">
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button onClick={() => setActionTarget({ booking: b, action: 'cancelled' })} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/10 transition-colors" aria-label="Cancel">
                              <Ban size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
        <p className="text-sm text-ink/40">
          {total === 0 ? 'No bookings' : `Showing ${rangeStart} to ${rangeEnd} of ${total} bookings`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      {/* View modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Booking Details">
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <p className="font-mono text-xs text-green">{viewTarget.id}</p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
              <div><p className="text-xs text-ink/40">Customer</p><p className="text-ink">{viewTarget.user_name}</p></div>
              <div><p className="text-xs text-ink/40">Email</p><p className="text-ink truncate">{viewTarget.user_email}</p></div>
              <div><p className="text-xs text-ink/40">Vehicle</p><p className="text-ink font-mono">{viewTarget.registration_number}</p></div>
              <div><p className="text-xs text-ink/40">Location</p><p className="text-ink">{viewTarget.listing_title}</p></div>
              <div><p className="text-xs text-ink/40">Owner</p><p className="text-ink">{viewTarget.owner_name}</p></div>
              <div><p className="text-xs text-ink/40">Amount</p><p className="text-ink font-semibold">{fmt(viewTarget.total_price)}</p></div>
              <div><p className="text-xs text-ink/40">Dates</p><p className="text-ink">{fmtDate(viewTarget.booking_start_date)} - {fmtDate(viewTarget.booking_end_date)}</p></div>
              <div><p className="text-xs text-ink/40">Status</p><Badge variant={statusVariant(viewTarget.status)} label={statusLabel(viewTarget.status)} /></div>
              <div><p className="text-xs text-ink/40">Payment</p><p className="text-ink capitalize">{viewTarget.payment_status}</p></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget?.action === 'confirmed' ? 'Approve Booking' : actionTarget?.booking.status === 'pending' ? 'Reject Booking' : 'Cancel Booking'}
        message={
          actionTarget?.action === 'confirmed'
            ? `Approve this booking for ${actionTarget?.booking.user_name}? It will move to Active status.`
            : `${actionTarget?.booking.status === 'pending' ? 'Reject' : 'Cancel'} this booking for ${actionTarget?.booking.user_name}? This cannot be undone from this screen.`
        }
        confirmLabel={actionTarget?.action === 'confirmed' ? 'Approve' : actionTarget?.booking.status === 'pending' ? 'Reject' : 'Cancel Booking'}
        onConfirm={confirmAction}
        onCancel={() => setActionTarget(null)}
        loading={actionSaving}
      />

      <ConfirmDialog
        open={bulkApproveOpen}
        title="Approve Selected Bookings"
        message={`Approve ${selectedBookings.filter((b) => b.status === 'pending').length} pending booking(s) from your selection? Non-pending selections are skipped.`}
        confirmLabel="Approve"
        onConfirm={confirmBulkApprove}
        onCancel={() => setBulkApproveOpen(false)}
        loading={bulkSaving}
      />
    </div>
  )
}
