import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Plus, Building2, ClipboardClock, CheckCircle2, Car, MoreVertical,
  Pencil, Eye, Ban, ArrowUp, ArrowDown, X, Download, Filter,
} from 'lucide-react'
import {
  getAdminLocations, getAdminLocationStats, updateAdminListingStatus, updateAdminListing,
  type AdminLocation, type LocationStats,
} from '../../api/admin.api'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

function deriveStatus(l: AdminLocation): 'active' | 'pending' | 'full' | 'inactive' {
  if (!l.is_active) return 'inactive'
  if (!l.is_approved) return 'pending'
  if (l.available_spaces === 0) return 'full'
  return 'active'
}

const STATUS_LABEL: Record<string, string> = { active: 'Active', pending: 'Pending', full: 'Full', inactive: 'Inactive' }
const STATUS_VARIANT: Record<string, 'green' | 'amber' | 'red' | 'gray'> = { active: 'green', pending: 'amber', full: 'red', inactive: 'gray' }

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'full', label: 'Full' },
  { value: 'inactive', label: 'Inactive' },
]

function occupancyStyle(filled: number, total: number) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  if (pct >= 100) return { pct, barClass: 'bg-danger' }
  if (pct >= 50) return { pct, barClass: 'bg-green' }
  return { pct, barClass: 'bg-line' }
}

function TrendPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink/40">New this month</span>
  const positive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-green-600' : 'text-danger'}`}>
      {positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{Math.abs(value)}%
    </span>
  )
}

function downloadLocationsCsv(rows: AdminLocation[], filename: string) {
  const header = ['ID', 'Name', 'Owner', 'Capacity', 'Status', 'Price/mo']
  const lines = rows.map((l) => [
    l.id, l.title, l.owner_name, `${l.total_spaces - l.available_spaces}/${l.total_spaces}`, STATUS_LABEL[deriveStatus(l)], l.monthly_price,
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

interface EditFormState { title: string; address: string }

export default function AdminLocations() {
  const [locations, setLocations] = useState<AdminLocation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<LocationStats | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewTarget, setViewTarget] = useState<AdminLocation | null>(null)
  const [editTarget, setEditTarget] = useState<AdminLocation | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ title: '', address: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [statusTarget, setStatusTarget] = useState<{ location: AdminLocation; severity: 'suspend' | 'delete' } | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminLocations({ search: search || undefined, status: status || undefined, page, limit })
      .then((d) => { setLocations(d.listings); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, page])
  useEffect(() => { setPage(1) }, [search, status])
  useEffect(() => { setSelected(new Set()) }, [locations])
  useEffect(() => { getAdminLocationStats().then(setStats).catch(() => {}) }, [])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const allSelected = locations.length > 0 && locations.every((l) => selected.has(l.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(locations.map((l) => l.id)))
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const selectedLocations = useMemo(() => locations.filter((l) => selected.has(l.id)), [locations, selected])

  const confirmBulkSuspend = async () => {
    setBulkSaving(true)
    try {
      await Promise.all(selectedLocations.filter((l) => l.is_active).map((l) => updateAdminListingStatus(l.id, false)))
      setBulkConfirmOpen(false)
      setSelected(new Set())
      load()
    } catch { /* partial failures still reflected on refetch */ } finally {
      setBulkSaving(false)
    }
  }

  const openEdit = (l: AdminLocation) => {
    setEditTarget(l)
    setEditForm({ title: l.title, address: l.address })
    setEditError('')
    setOpenMenuId(null)
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    setEditError('')
    try {
      await updateAdminListing(editTarget.id, editForm)
      setEditTarget(null)
      load()
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Could not update location')
    } finally {
      setEditSaving(false)
    }
  }

  const confirmStatusToggle = async () => {
    if (!statusTarget) return
    setStatusSaving(true)
    try {
      await updateAdminListingStatus(statusTarget.location.id, !statusTarget.location.is_active)
      setStatusTarget(null)
      load()
    } catch { /* keep dialog open on failure */ } finally {
      setStatusSaving(false)
    }
  }

  const statCards = useMemo(() => stats ? [
    { label: 'Total Locations', value: stats.total, icon: Building2, iconClass: 'bg-blue-100 text-blue-500', trend: stats.trends.total },
    { label: 'Pending Approval', value: stats.pending, icon: ClipboardClock, iconClass: 'bg-amber/20 text-amber-700', trend: stats.trends.pending },
    { label: 'Active Listings', value: stats.active, icon: CheckCircle2, iconClass: 'bg-green/10 text-green', trend: null },
    { label: 'Fully Booked', value: stats.full, icon: Car, iconClass: 'bg-danger/10 text-danger', trend: null },
  ] : [], [stats])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Parking Locations</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Parking Locations</h1>
          <p className="text-sm text-ink/50 mt-1">Manage inventory, monitor status, and update details.</p>
        </div>
        <Link
          to="/admin/locations"
          title="Locations are created by owners via the Owner Portal — there's no standalone admin creation flow yet"
          className="inline-flex items-center gap-2 bg-green/50 text-white font-medium text-sm px-4 py-2.5 rounded-lg cursor-not-allowed shrink-0 pointer-events-none"
        >
          <Plus size={16} /> Add New Parking
        </Link>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink/50">{c.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.iconClass}`}>
                  <c.icon size={16} />
                </div>
              </div>
              <p className="font-display text-2xl font-semibold text-navy mt-1">{c.value.toLocaleString('en-IN')}</p>
              <div className="mt-1"><TrendPill value={c.trend} /></div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by parking name, owner, or ID..." className="flex-1 min-w-[220px]" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All Statuses" options={STATUS_OPTIONS} />
        <button
          title="Additional filters aren't available yet"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-green/60 cursor-default"
        >
          <Filter size={14} /> More
        </button>
        <button
          onClick={() => downloadLocationsCsv(locations, `locations-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="ml-auto inline-flex items-center gap-2 border border-line text-ink/70 font-medium text-sm px-4 py-2 rounded-lg hover:bg-concrete transition-colors"
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="bg-navy text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadLocationsCsv(selectedLocations, `locations-selected-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} /> Export Selected
            </button>
            <button
              onClick={() => setBulkConfirmOpen(true)}
              disabled={!selectedLocations.some((l) => l.is_active)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-danger hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
            >
              <Ban size={14} /> Suspend Selected
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
                <th className="px-4 py-3 font-semibold">Parking Location</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Capacity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Price/Mo</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-12 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : locations.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink/40">No locations found.</td></tr>
              ) : (
                locations.map((l) => {
                  const st = deriveStatus(l)
                  const filled = l.total_spaces - l.available_spaces
                  const occ = occupancyStyle(filled, l.total_spaces)
                  return (
                    <tr key={l.id} className="hover:bg-concrete/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-concrete border border-line flex items-center justify-center shrink-0 overflow-hidden">
                            {l.thumbnail ? <img src={l.thumbnail} alt="" className="w-full h-full object-cover" /> : <Building2 size={16} className="text-ink/30" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{l.title}</p>
                            <p className="text-xs text-ink/40 font-mono truncate">ID: {l.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-ink truncate">{l.owner_name}</p>
                        <p className="text-xs text-ink/40 truncate">{l.owner_email}</p>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink/70">{filled}/{l.total_spaces}</span>
                          <span className="text-ink/40 font-medium">{occ.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-concrete overflow-hidden">
                          <div className={`h-full rounded-full ${occ.barClass}`} style={{ width: `${Math.min(occ.pct, 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[st]} label={STATUS_LABEL[st]} /></td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(l.monthly_price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end relative">
                          <button
                            onClick={() => setOpenMenuId((v) => (v === l.id ? null : l.id))}
                            className="p-2 rounded-lg text-ink/50 hover:text-ink hover:bg-concrete transition-colors"
                            aria-label="More actions"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {openMenuId === l.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-9 z-20 bg-white rounded-lg border border-line shadow-lg py-1 w-44">
                                <button onClick={() => openEdit(l)} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-ink/70 hover:bg-concrete transition-colors">
                                  <Pencil size={13} /> Edit
                                </button>
                                <button onClick={() => { setViewTarget(l); setOpenMenuId(null) }} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-ink/70 hover:bg-concrete transition-colors">
                                  <Eye size={13} /> View Details
                                </button>
                                <div className="border-t border-line my-1" />
                                <button onClick={() => { setStatusTarget({ location: l, severity: 'suspend' }); setOpenMenuId(null) }} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors">
                                  <Ban size={13} /> {l.is_active ? 'Suspend' : 'Reactivate'}
                                </button>
                                {l.is_active && (
                                  <button onClick={() => { setStatusTarget({ location: l, severity: 'delete' }); setOpenMenuId(null) }} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors">
                                    <X size={13} /> Delete
                                  </button>
                                )}
                              </div>
                            </>
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
          {total === 0 ? 'No results' : `Showing ${rangeStart}-${rangeEnd} of ${total} results`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      {/* View modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Location Details">
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-concrete border border-line flex items-center justify-center overflow-hidden shrink-0">
                {viewTarget.thumbnail ? <img src={viewTarget.thumbnail} alt="" className="w-full h-full object-cover" /> : <Building2 size={18} className="text-ink/30" />}
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink truncate">{viewTarget.title}</p>
                <p className="text-xs text-ink/40 font-mono">ID: {viewTarget.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
              <div className="col-span-2"><p className="text-xs text-ink/40">Address</p><p className="text-ink">{viewTarget.address}</p></div>
              <div><p className="text-xs text-ink/40">Owner</p><p className="text-ink">{viewTarget.owner_name}</p></div>
              <div><p className="text-xs text-ink/40">Owner Email</p><p className="text-ink truncate">{viewTarget.owner_email}</p></div>
              <div><p className="text-xs text-ink/40">Capacity</p><p className="text-ink">{viewTarget.total_spaces - viewTarget.available_spaces}/{viewTarget.total_spaces}</p></div>
              <div><p className="text-xs text-ink/40">Price / Month</p><p className="text-ink font-semibold">{fmt(viewTarget.monthly_price)}</p></div>
              <div><p className="text-xs text-ink/40">Status</p><Badge variant={STATUS_VARIANT[deriveStatus(viewTarget)]} label={STATUS_LABEL[deriveStatus(viewTarget)]} /></div>
              <div><p className="text-xs text-ink/40">Listed Since</p><p className="text-ink">{fmtDate(viewTarget.created_at)}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Location">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Parking Name" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} required />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} required />
          {editError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{editError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</Button>
            <Button type="submit" loading={editSaving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!statusTarget}
        title={
          !statusTarget?.location.is_active ? 'Reactivate Location'
            : statusTarget?.severity === 'delete' ? 'Delete Location' : 'Suspend Location'
        }
        message={
          !statusTarget?.location.is_active
            ? `Reactivate ${statusTarget?.location.title}? It will become visible to renters again.`
            : statusTarget?.severity === 'delete'
              ? `Delete ${statusTarget?.location.title}? This deactivates and hides the listing platform-wide. Existing bookings are kept for records; it won't accept new ones. This mirrors the same soft-delete used elsewhere in the app — nothing is permanently erased.`
              : `Suspend ${statusTarget?.location.title}? It will be hidden from search until reactivated.`
        }
        confirmLabel={!statusTarget?.location.is_active ? 'Reactivate' : statusTarget?.severity === 'delete' ? 'Delete' : 'Suspend'}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusTarget(null)}
        loading={statusSaving}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Suspend Selected Locations"
        message={`Suspend ${selectedLocations.filter((l) => l.is_active).length} selected location(s)? They will be hidden from search until reactivated individually.`}
        confirmLabel="Suspend"
        onConfirm={confirmBulkSuspend}
        onCancel={() => setBulkConfirmOpen(false)}
        loading={bulkSaving}
      />
    </div>
  )
}
