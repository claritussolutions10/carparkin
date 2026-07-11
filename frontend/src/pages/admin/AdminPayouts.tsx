import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Wallet, Clock, Users, X, CheckCircle2 } from 'lucide-react'
import {
  getAdminPayoutStats, getAdminPayouts, markAdminPayoutsPaid,
  type AdminPayout, type PayoutStats,
} from '../../api/admin.api'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
]

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PayoutStats | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const limit = 20

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminPayouts({ search: search || undefined, status: status || undefined, page, limit })
      .then((d) => { setPayouts(d.payouts); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  const loadStats = () => getAdminPayoutStats().then(setStats).catch(() => {})

  useEffect(() => { load() }, [search, status, page])
  useEffect(() => { setPage(1) }, [search, status])
  useEffect(() => { setSelected(new Set()) }, [payouts])
  useEffect(() => { loadStats() }, [])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const pendingRows = useMemo(() => payouts.filter((p) => p.status === 'pending'), [payouts])
  const allSelected = pendingRows.length > 0 && pendingRows.every((p) => selected.has(p.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pendingRows.map((p) => p.id)))
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const selectedTotal = useMemo(
    () => payouts.filter((p) => selected.has(p.id)).reduce((sum, p) => sum + Number(p.net_amount), 0),
    [payouts, selected]
  )

  const confirmMarkPaid = async () => {
    setSaving(true)
    try {
      await markAdminPayoutsPaid(Array.from(selected))
      setConfirmOpen(false)
      setSelected(new Set())
      load()
      loadStats()
    } catch { /* keep dialog open on failure */ } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Payouts</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Owner Payouts</h1>
        <p className="text-sm text-ink/50 mt-1">Review and settle commission-adjusted earnings owed to parking owners.</p>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Pending Payout</p>
              <div className="w-9 h-9 rounded-lg bg-amber/20 text-amber-700 flex items-center justify-center shrink-0"><Clock size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{fmt(stats.pendingAmount)}</p>
            <p className="text-xs text-ink/40 mt-1">{stats.pendingCount} transaction{stats.pendingCount === 1 ? '' : 's'}</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Paid This Month</p>
              <div className="w-9 h-9 rounded-lg bg-green/10 text-green flex items-center justify-center shrink-0"><Wallet size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{fmt(stats.paidThisMonth)}</p>
          </div>
          <div className="bg-surface rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Owners Awaiting</p>
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><Users size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-ink mt-1">{stats.ownersAwaiting}</p>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by owner or listing..." className="flex-1 min-w-[220px]" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All Statuses" options={STATUS_OPTIONS} />
        <span className="ml-auto text-sm text-ink/40">{total} transaction{total === 1 ? '' : 's'}</span>
      </div>

      {selected.size > 0 && (
        <div className="bg-navy text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected · {fmt(selectedTotal)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-green hover:bg-green-light px-3 py-1.5 rounded-lg transition-colors"
            >
              <CheckCircle2 size={14} /> Mark as Paid
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={pendingRows.length === 0} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                </th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Listing</th>
                <th className="px-4 py-3 font-semibold text-right">Gross</th>
                <th className="px-4 py-3 font-semibold text-right">Commission</th>
                <th className="px-4 py-3 font-semibold text-right">Net Payout</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-10 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : payouts.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink/40">No payouts found.</td></tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-concrete/50 transition-colors">
                    <td className="px-4 py-3">
                      {p.status === 'pending' && (
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink truncate">{p.owner_name}</p>
                      <p className="text-xs text-ink/40 truncate">{p.owner_email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70 truncate max-w-[200px]">{p.listing_title}</td>
                    <td className="px-4 py-3 text-right text-ink/70">{fmt(p.gross_amount)}</td>
                    <td className="px-4 py-3 text-right text-ink/50">-{fmt(p.commission_amount)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(p.net_amount)}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-ink/50">{p.transaction_date ? fmtDate(p.transaction_date) : fmtDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
        <p className="text-sm text-ink/40">
          {total === 0 ? 'No payouts' : `Showing ${rangeStart} to ${rangeEnd} of ${total} payouts`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Mark Payouts as Paid"
        message={`Mark ${selected.size} selected transaction${selected.size === 1 ? '' : 's'} totalling ${fmt(selectedTotal)} as paid? Affected owners will be notified. This does not send money - confirm the transfer has already been made outside the platform.`}
        confirmLabel="Mark as Paid"
        onConfirm={confirmMarkPaid}
        onCancel={() => setConfirmOpen(false)}
        loading={saving}
      />
    </div>
  )
}
