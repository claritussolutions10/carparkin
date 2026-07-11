import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Plus, Download, Pencil, Trash2, Eye, X, Mail, Phone, MapPin, Filter,
  ShieldCheck, Building2, FileText, Check,
} from 'lucide-react'
import {
  getAdminOwners, updateAdminUserStatus, updateAdminUser,
  getAdminOwnerVerification, reviewAdminOwnerKyc, reviewAdminOwnerBank,
  type AdminOwner, type OwnerVerification,
} from '../../api/admin.api'
import { signup } from '../../api/auth.api'
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

function deriveStatus(o: AdminOwner): 'active' | 'pending' | 'suspended' {
  if (!o.is_active) return 'suspended'
  if (!o.kyc_verified || !o.bank_account_verified) return 'pending'
  return 'active'
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
]

const JOINED_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'This Year' },
]

function joinedFromDate(days: string) {
  if (!days) return undefined
  const d = new Date()
  d.setDate(d.getDate() - Number(days))
  return d.toISOString()
}

function downloadOwnersCsv(rows: AdminOwner[], filename: string) {
  const header = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Listings', 'Revenue', 'Joined']
  const lines = rows.map((o) => [
    o.id, o.full_name, o.email, o.phone_number || '', deriveStatus(o), o.listing_count, o.revenue, o.created_at,
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

interface EditFormState { fullName: string; phoneNumber: string }

function verificationLabel(verified: boolean, submittedAt: string | null, rejectedReason: string | null) {
  if (verified) return { label: 'Verified', className: 'text-green-700 bg-green-100' }
  if (rejectedReason) return { label: 'Rejected', className: 'text-danger bg-danger/10' }
  if (submittedAt) return { label: 'Pending Review', className: 'text-amber-700 bg-amber/10' }
  return { label: 'Not Submitted', className: 'text-ink/50 bg-concrete' }
}

function VerificationPanel({
  icon: Icon, title, verified, submittedAt, rejectedReason, detail, docUrl, onApprove, onReject, busy,
}: {
  icon: typeof ShieldCheck
  title: string
  verified: boolean
  submittedAt: string | null
  rejectedReason: string | null
  detail?: React.ReactNode
  docUrl?: string | null
  onApprove: () => void
  onReject: (reason: string) => void
  busy: boolean
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const status = verificationLabel(verified, submittedAt, rejectedReason)
  const isPending = !verified && !!submittedAt && !rejectedReason

  return (
    <div className="rounded-lg border border-line px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${verified ? 'bg-green/15 text-green-700' : 'bg-concrete text-ink/40'}`}>
            <Icon size={16} />
          </div>
          <p className="text-sm font-semibold text-ink">{title}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${status.className}`}>{status.label}</span>
      </div>
      {detail && <div className="mt-2 text-xs text-ink/60">{detail}</div>}
      {docUrl && (
        <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:text-green transition-colors mt-2">
          <FileText size={12} /> View submitted document
        </a>
      )}
      {rejectedReason && <p className="text-xs text-danger mt-2">Rejected: {rejectedReason}</p>}
      {isPending && !rejecting && (
        <div className="flex items-center gap-2 mt-3">
          <Button type="button" onClick={onApprove} loading={busy} className="!py-1.5 !px-3 !text-xs">
            <Check size={12} /> Approve
          </Button>
          <Button type="button" variant="secondary" onClick={() => setRejecting(true)} disabled={busy} className="!py-1.5 !px-3 !text-xs">
            Reject
          </Button>
        </div>
      )}
      {isPending && rejecting && (
        <div className="mt-3 space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection"
            className="w-full rounded-lg border border-line px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="danger" onClick={() => onReject(reason)} loading={busy} disabled={!reason.trim()} className="!py-1.5 !px-3 !text-xs">
              Confirm Reject
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRejecting(false)} disabled={busy} className="!py-1.5 !px-3 !text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOwners() {
  const [owners, setOwners] = useState<AdminOwner[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [joined, setJoined] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [viewTarget, setViewTarget] = useState<AdminOwner | null>(null)
  const [verification, setVerification] = useState<OwnerVerification | null>(null)
  const [verificationBusy, setVerificationBusy] = useState<'kyc' | 'bank' | null>(null)
  const [editTarget, setEditTarget] = useState<AdminOwner | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ fullName: '', phoneNumber: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [statusTarget, setStatusTarget] = useState<AdminOwner | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '' })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const load = () => {
    setLoading(true)
    getAdminOwners({ search: search || undefined, status: status || undefined, joinedFrom: joinedFromDate(joined), page, limit })
      .then((d) => { setOwners(d.owners); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, joined, page])
  useEffect(() => { setPage(1) }, [search, status, joined])
  useEffect(() => { setSelected(new Set()) }, [owners])

  useEffect(() => {
    if (!viewTarget) { setVerification(null); return }
    getAdminOwnerVerification(viewTarget.id).then(setVerification).catch(() => setVerification(null))
  }, [viewTarget])

  const refreshVerification = () => {
    if (viewTarget) getAdminOwnerVerification(viewTarget.id).then(setVerification).catch(() => {})
  }

  const approveKyc = async () => {
    if (!viewTarget) return
    setVerificationBusy('kyc')
    try { await reviewAdminOwnerKyc(viewTarget.id, true); refreshVerification(); load() } finally { setVerificationBusy(null) }
  }
  const rejectKyc = async (reason: string) => {
    if (!viewTarget) return
    setVerificationBusy('kyc')
    try { await reviewAdminOwnerKyc(viewTarget.id, false, reason); refreshVerification(); load() } finally { setVerificationBusy(null) }
  }
  const approveBank = async () => {
    if (!viewTarget) return
    setVerificationBusy('bank')
    try { await reviewAdminOwnerBank(viewTarget.id, true); refreshVerification(); load() } finally { setVerificationBusy(null) }
  }
  const rejectBank = async (reason: string) => {
    if (!viewTarget) return
    setVerificationBusy('bank')
    try { await reviewAdminOwnerBank(viewTarget.id, false, reason); refreshVerification(); load() } finally { setVerificationBusy(null) }
  }

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const allSelected = owners.length > 0 && owners.every((o) => selected.has(o.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(owners.map((o) => o.id)))
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const selectedOwners = useMemo(() => owners.filter((o) => selected.has(o.id)), [owners, selected])

  const openEdit = (o: AdminOwner) => {
    setEditTarget(o)
    setEditForm({ fullName: o.full_name, phoneNumber: o.phone_number })
    setEditError('')
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    setEditError('')
    try {
      await updateAdminUser(editTarget.id, editForm)
      setEditTarget(null)
      load()
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Could not update owner')
    } finally {
      setEditSaving(false)
    }
  }

  const confirmStatusToggle = async () => {
    if (!statusTarget) return
    setStatusSaving(true)
    try {
      await updateAdminUserStatus(statusTarget.id, !statusTarget.is_active)
      setStatusTarget(null)
      load()
    } catch { /* keep dialog open on failure */ } finally {
      setStatusSaving(false)
    }
  }

  const confirmBulkSuspend = async () => {
    setBulkSaving(true)
    try {
      await Promise.all(selectedOwners.map((o) => updateAdminUserStatus(o.id, false)))
      setBulkConfirmOpen(false)
      setSelected(new Set())
      load()
    } catch { /* partial failures still reflected on refetch */ } finally {
      setBulkSaving(false)
    }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      await signup({
        full_name: addForm.fullName,
        email: addForm.email,
        password: addForm.password,
        phone_number: addForm.phoneNumber,
        role: 'owner',
      })
      setAddOpen(false)
      setAddForm({ fullName: '', email: '', phoneNumber: '', password: '' })
      load()
    } catch (err: any) {
      setAddError(err?.response?.data?.error || err?.response?.data?.message || 'Could not create owner')
    } finally {
      setAddSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Owners</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Parking Owners</h1>
          <p className="text-sm text-ink/50 mt-1">Manage and verify parking spot providers on the platform.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0"
        >
          <Plus size={16} /> Add New Owner
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-surface rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or phone number..." className="flex-1 min-w-[220px]" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status: All" options={STATUS_OPTIONS} />
        <Select value={joined} onChange={(e) => setJoined(e.target.value)} options={JOINED_OPTIONS} />
        <button
          title="Additional filters aren't available yet"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-green/60 cursor-default"
        >
          <Filter size={14} /> More Filters
        </button>
        <button
          onClick={() => downloadOwnersCsv(owners, `owners-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`)}
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
              onClick={() => downloadOwnersCsv(selectedOwners, `owners-selected-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} /> Export Selected
            </button>
            <button
              onClick={() => setBulkConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-danger hover:bg-danger/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Suspend Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                </th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Contact Info</th>
                <th className="px-4 py-3 font-semibold">Listings</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined Date</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-10 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : owners.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink/40">No owners found.</td></tr>
              ) : (
                owners.map((o) => {
                  const st = deriveStatus(o)
                  const dotClass = st === 'active' ? 'bg-green' : st === 'pending' ? 'bg-amber' : 'bg-danger'
                  return (
                    <tr key={o.id} className="hover:bg-concrete/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-green text-white text-sm flex items-center justify-center font-medium overflow-hidden">
                              {o.profile_picture ? <img src={o.profile_picture} alt="" className="w-full h-full object-cover" /> : o.full_name[0]}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dotClass}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{o.full_name}</p>
                            <p className="text-xs text-ink/40 font-mono truncate">ID: {o.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink/70 flex items-center gap-1.5 truncate"><Mail size={12} className="text-ink/30 shrink-0" /> {o.email}</p>
                        <p className="text-xs text-ink/40 flex items-center gap-1.5 mt-0.5"><Phone size={11} className="text-ink/30 shrink-0" /> {o.phone_number || '–'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 border border-line rounded-full px-2.5 py-1 text-xs font-medium text-ink/70">
                          <MapPin size={11} className="text-ink/40" /> {o.listing_count} Location{Number(o.listing_count) === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={st === 'active' ? 'green' : st === 'pending' ? 'amber' : 'red'}
                          label={st === 'active' ? 'Active' : st === 'pending' ? 'Pending' : 'Suspended'}
                        />
                      </td>
                      <td className="px-4 py-3 text-ink/50">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(o.revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewTarget(o)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="View">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setStatusTarget(o)} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/10 transition-colors" aria-label={o.is_active ? 'Suspend' : 'Reactivate'}>
                            <Trash2 size={15} />
                          </button>
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
          {total === 0 ? 'No owners' : `Showing ${rangeStart} to ${rangeEnd} of ${total} owners`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      {/* View modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Owner Details">
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green text-white flex items-center justify-center font-semibold overflow-hidden">
                {viewTarget.profile_picture ? <img src={viewTarget.profile_picture} alt="" className="w-full h-full object-cover" /> : viewTarget.full_name[0]}
              </div>
              <div>
                <p className="font-display font-semibold text-ink">{viewTarget.full_name}</p>
                <p className="text-xs text-ink/40 font-mono">ID: {viewTarget.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
              <div><p className="text-xs text-ink/40">Email</p><p className="text-ink">{viewTarget.email}</p></div>
              <div><p className="text-xs text-ink/40">Phone</p><p className="text-ink">{viewTarget.phone_number || '–'}</p></div>
              <div><p className="text-xs text-ink/40">Listings</p><p className="text-ink">{viewTarget.listing_count}</p></div>
              <div><p className="text-xs text-ink/40">Revenue</p><p className="text-ink font-semibold">{fmt(viewTarget.revenue)}</p></div>
              <div>
                <p className="text-xs text-ink/40">Status</p>
                {(() => {
                  const st = deriveStatus(viewTarget)
                  return <Badge variant={st === 'active' ? 'green' : st === 'pending' ? 'amber' : 'red'} label={st === 'active' ? 'Active' : st === 'pending' ? 'Pending' : 'Suspended'} />
                })()}
              </div>
              <div><p className="text-xs text-ink/40">Joined</p><p className="text-ink">{fmtDate(viewTarget.created_at)}</p></div>
            </div>

            {verification && (
              <div className="pt-3 border-t border-line space-y-3">
                <VerificationPanel
                  icon={ShieldCheck}
                  title="KYC Verification"
                  verified={verification.kyc_verified}
                  submittedAt={verification.kyc_submitted_at}
                  rejectedReason={verification.kyc_rejected_reason}
                  docUrl={verification.kyc_document_url}
                  detail={verification.kyc_document_type ? `Document type: ${verification.kyc_document_type}` : undefined}
                  onApprove={approveKyc}
                  onReject={rejectKyc}
                  busy={verificationBusy === 'kyc'}
                />
                <VerificationPanel
                  icon={Building2}
                  title="Bank Account"
                  verified={verification.bank_account_verified}
                  submittedAt={verification.bank_submitted_at}
                  rejectedReason={verification.bank_rejected_reason}
                  detail={verification.bank_account_number ? `${verification.bank_account_holder_name} · ${verification.bank_account_number} · ${verification.bank_ifsc}` : undefined}
                  onApprove={approveBank}
                  onReject={rejectBank}
                  busy={verificationBusy === 'bank'}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Owner">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Phone Number" value={editForm.phoneNumber} onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))} required />
          {editError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{editError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</Button>
            <Button type="submit" loading={editSaving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Add owner modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Owner">
        <form onSubmit={submitAdd} className="space-y-4">
          <Input label="Full Name" value={addForm.fullName} onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Email" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone Number" value={addForm.phoneNumber} onChange={(e) => setAddForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+91 98765 43210" required />
          <Input label="Password" type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
          {addError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{addError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</Button>
            <Button type="submit" loading={addSaving}>Create Owner</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.is_active ? 'Suspend Owner' : 'Reactivate Owner'}
        message={
          statusTarget?.is_active
            ? `Suspend ${statusTarget?.full_name}? Their listings will remain but they will lose account access until reactivated.`
            : `Reactivate ${statusTarget?.full_name}? They will regain account access immediately.`
        }
        confirmLabel={statusTarget?.is_active ? 'Suspend' : 'Reactivate'}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusTarget(null)}
        loading={statusSaving}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Suspend Selected Owners"
        message={`Suspend ${selected.size} selected owner${selected.size === 1 ? '' : 's'}? They will lose access until reactivated individually.`}
        confirmLabel="Suspend"
        onConfirm={confirmBulkSuspend}
        onCancel={() => setBulkConfirmOpen(false)}
        loading={bulkSaving}
      />
    </div>
  )
}
