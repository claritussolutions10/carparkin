import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, History, ChevronDown } from 'lucide-react'
import { getAdminAuditLog, type AuditLogEntry } from '../../api/admin.api'
import Select from '../../components/common/Select'
import Pagination from '../../components/common/Pagination'

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const ACTION_OPTIONS = [
  { value: 'user.status_change', label: 'User: Status Change' },
  { value: 'user.update', label: 'User: Update' },
  { value: 'listing.status_change', label: 'Listing: Status Change' },
  { value: 'listing.update', label: 'Listing: Update' },
  { value: 'listing.approve', label: 'Listing: Approve' },
  { value: 'listing.reject', label: 'Listing: Reject' },
  { value: 'booking.status_change', label: 'Booking: Status Change' },
  { value: 'amenity.create', label: 'Amenity: Create' },
  { value: 'amenity.update', label: 'Amenity: Update' },
  { value: 'parking_type.create', label: 'Parking Type: Create' },
  { value: 'parking_type.update', label: 'Parking Type: Update' },
  { value: 'subscription_plan.create', label: 'Subscription Plan: Create' },
  { value: 'subscription_plan.update', label: 'Subscription Plan: Update' },
  { value: 'support_ticket.reply', label: 'Support Ticket: Reply' },
  { value: 'payout.mark_paid', label: 'Payout: Mark Paid' },
  { value: 'review.delete', label: 'Review: Delete' },
  { value: 'platform_settings.update', label: 'Platform Settings: Update' },
]

const ENTITY_TYPE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'listing', label: 'Listing' },
  { value: 'booking', label: 'Booking' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'parking_type', label: 'Parking Type' },
  { value: 'subscription_plan', label: 'Subscription Plan' },
  { value: 'support_ticket', label: 'Support Ticket' },
  { value: 'payout', label: 'Payout' },
  { value: 'review', label: 'Review' },
  { value: 'platform_settings', label: 'Platform Settings' },
]

function actionLabel(action: string) {
  return ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action
}

function DetailsCell({ details }: { details: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false)
  if (!details || Object.keys(details).length === 0) return <span className="text-ink/30">–</span>
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:text-green transition-colors">
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} /> {open ? 'Hide' : 'View'}
      </button>
      {open && (
        <pre className="mt-1.5 text-xs bg-concrete rounded-lg p-2 max-w-xs overflow-x-auto text-ink/70">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const load = () => {
    setLoading(true)
    getAdminAuditLog({ action: action || undefined, entityType: entityType || undefined, page, limit })
      .then((d) => { setEntries(d.entries); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [action, entityType, page])
  useEffect(() => { setPage(1) }, [action, entityType])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Audit Log</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Audit Log</h1>
        <p className="text-sm text-ink/50 mt-1">Every mutation made from the admin console - who changed what, and when.</p>
      </div>

      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <Select value={action} onChange={(e) => setAction(e.target.value)} placeholder="All Actions" options={ACTION_OPTIONS} />
        <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="All Entity Types" options={ENTITY_TYPE_OPTIONS} />
        <span className="ml-auto text-sm text-ink/40">{total} entr{total === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-ink/40">
                    <History size={28} className="mx-auto mb-2 text-ink/20" />
                    No audit entries match this filter.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-concrete/50 transition-colors align-top">
                    <td className="px-4 py-3 text-ink/50 whitespace-nowrap">{fmtDateTime(e.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink truncate">{e.admin_name}</p>
                      <p className="text-xs text-ink/40 truncate">{e.admin_email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{actionLabel(e.action)}</td>
                    <td className="px-4 py-3 text-ink/50 font-mono text-xs">
                      {e.entity_type}{e.entity_id ? `:${e.entity_id}` : ''}
                    </td>
                    <td className="px-4 py-3"><DetailsCell details={e.details} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
        <p className="text-sm text-ink/40">
          {total === 0 ? 'No entries' : `Showing ${rangeStart} to ${rangeEnd} of ${total} entries`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>
    </div>
  )
}
