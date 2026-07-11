import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Download, ClipboardClock, CheckCircle2, XCircle, Camera, MapPin, Filter, ArrowUpDown,
} from 'lucide-react'
import {
  getPendingListings, getApprovalStats, approveAdminListing, rejectAdminListing,
  type PendingListing, type ApprovalStats,
} from '../../api/admin.api'
import SearchInput from '../../components/common/SearchInput'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }

function timeAgo(d: string) {
  const diffMs = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const REJECTION_REASONS = [
  'Bad Photos',
  'Incomplete Address',
  'Duplicate Listing',
  'Suspicious Pricing',
  'Missing Documents',
  'Other',
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

function downloadPendingCsv(rows: PendingListing[]) {
  const header = ['ID', 'Name', 'Owner', 'Address', 'Price/mo', 'Submitted']
  const lines = rows.map((l) => [
    l.id, l.title, l.owner_name, l.address, l.monthly_price, l.created_at,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pending-approvals-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PendingApprovals() {
  const [listings, setListings] = useState<PendingListing[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [rejectTarget, setRejectTarget] = useState<PendingListing | null>(null)
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0])
  const [rejectSaving, setRejectSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getPendingListings(search || undefined).then(setListings).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])
  useEffect(() => { getApprovalStats().then(setStats).catch(() => {}) }, [])

  const sorted = useMemo(() => {
    const copy = [...listings]
    copy.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sort === 'newest' ? -diff : diff
    })
    return copy
  }, [listings, sort])

  const approve = async (id: string) => {
    setActioningId(id)
    try {
      await approveAdminListing(id)
      setListings((l) => l.filter((x) => x.id !== id))
      getApprovalStats().then(setStats).catch(() => {})
    } catch { /* leave card in place on failure */ } finally {
      setActioningId(null)
    }
  }

  const openReject = (l: PendingListing) => {
    setRejectTarget(l)
    setRejectReason(REJECTION_REASONS[0])
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    setRejectSaving(true)
    try {
      await rejectAdminListing(rejectTarget.id, rejectReason)
      setListings((l) => l.filter((x) => x.id !== rejectTarget.id))
      setRejectTarget(null)
      getApprovalStats().then(setStats).catch(() => {})
    } catch { /* keep modal open on failure */ } finally {
      setRejectSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/admin/locations" className="hover:text-green transition-colors">Parkings</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Pending Approvals</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Pending Approvals</h1>
          <p className="text-sm text-ink/50 mt-1">Review and act on new parking location requests. Verify ownership documents and location accuracy.</p>
        </div>
        <button
          onClick={() => downloadPendingCsv(sorted)}
          className="inline-flex items-center gap-2 border border-line text-ink/70 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-concrete transition-colors shrink-0"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Total Pending</p>
              <div className="w-9 h-9 rounded-lg bg-amber/20 text-amber-700 flex items-center justify-center shrink-0"><ClipboardClock size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.totalPending}</p>
            <p className="text-xs text-amber-700 mt-1">Awaiting review right now</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Approved Today</p>
              <div className="w-9 h-9 rounded-lg bg-green/10 text-green flex items-center justify-center shrink-0"><CheckCircle2 size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.approvedToday}</p>
            <p className="text-xs text-green-600 mt-1">Since midnight</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Rejected Today</p>
              <div className="w-9 h-9 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0"><XCircle size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.rejectedToday}</p>
            <p className="text-xs text-danger mt-1">
              {stats.topRejectionReason ? `Main reason: ${stats.topRejectionReason}` : 'No rejections yet today'}
            </p>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-surface rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by location, owner name, or ID..." className="flex-1 min-w-[220px]" />
        <button
          title="Additional filters aren't available yet"
          className="inline-flex items-center gap-1.5 text-sm font-medium border border-line text-ink/70 px-4 py-2 rounded-lg cursor-default"
        >
          <Filter size={14} /> Filters
        </button>
        <button
          onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          className="inline-flex items-center gap-1.5 text-sm font-medium border border-line text-ink/70 px-4 py-2 rounded-lg hover:bg-concrete transition-colors"
        >
          <ArrowUpDown size={14} /> Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label}
        </button>
      </div>

      {/* Pending grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-96 bg-surface rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line py-20 text-center">
          <CheckCircle2 size={40} className="text-green mx-auto mb-3" />
          <p className="text-ink font-medium">All caught up!</p>
          <p className="text-ink/40 text-sm mt-1">No listings pending approval.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((l) => (
            <div key={l.id} className="bg-surface rounded-xl border border-line overflow-hidden flex flex-col">
              {/* Image */}
              <div className="relative h-40 bg-concrete shrink-0">
                {l.images.length > 0 ? (
                  <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin size={28} className="text-ink/20" />
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 text-xs font-semibold bg-amber/90 text-white px-2.5 py-1 rounded-full">Pending Review</span>
                {l.images.length > 0 && (
                  <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded-full">
                    <Camera size={11} /> {l.images.length} Photo{l.images.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-ink truncate">{l.title}</h3>
                  <p className="shrink-0 text-sm font-bold text-blue-500">{fmt(l.monthly_price)}<span className="text-xs font-normal text-ink/40">/mo</span></p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-ink/50 mt-1">
                  <MapPin size={12} className="text-ink/30 shrink-0" /> <span className="truncate">{l.address}</span>
                </p>

                {l.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {l.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="text-xs border border-line text-ink/60 rounded-full px-2 py-0.5">{a}</span>
                    ))}
                  </div>
                )}

                <div className="border-t border-line mt-3 pt-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium shrink-0 overflow-hidden">
                    {l.owner_avatar ? <img src={l.owner_avatar} alt="" className="w-full h-full object-cover" /> : <MapPin size={12} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{l.owner_name}</p>
                    <p className="text-xs text-ink/40">Submitted {timeAgo(l.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button variant="secondary" className="border-danger/40 text-danger hover:border-danger" onClick={() => openReject(l)} disabled={actioningId === l.id}>
                    Reject
                  </Button>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    loading={actioningId === l.id}
                    onClick={() => approve(l.id)}
                  >
                    <CheckCircle2 size={15} /> Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Listing">
        <div className="space-y-4">
          <p className="text-sm text-ink/60">
            Rejecting <span className="font-medium text-ink">{rejectTarget?.title}</span>. Select a reason — this feeds the daily rejection breakdown.
          </p>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Reason</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
            >
              {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectTarget(null)} disabled={rejectSaving}>Cancel</Button>
            <Button type="button" variant="danger" loading={rejectSaving} onClick={confirmReject}>Reject Listing</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
