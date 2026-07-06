import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Inbox, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react'
import {
  getAdminSupportTickets, getAdminSupportTicketStats, replyAdminSupportTicket,
  type AdminSupportTicket, type SupportTicketStats,
} from '../../api/admin.api'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry', billing: 'Billing', booking: 'Booking Issue', technical: 'Technical Problem', other: 'Other',
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
]

export default function AdminSupport() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SupportTicketStats | null>(null)

  const [status, setStatus] = useState('open')
  const [urgentOnly, setUrgentOnly] = useState(false)

  const [replyTarget, setReplyTarget] = useState<AdminSupportTicket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminSupportTickets({ status: status || undefined, urgentOnly, limit: 100 })
      .then((d) => { setTickets(d.tickets); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status, urgentOnly])
  useEffect(() => { getAdminSupportTicketStats().then(setStats).catch(() => {}) }, [])

  const openReply = (t: AdminSupportTicket) => { setReplyTarget(t); setReplyText(t.admin_reply ?? '') }

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyTarget || !replyText.trim()) return
    setReplySaving(true)
    try {
      await replyAdminSupportTicket(replyTarget.id, replyText.trim())
      setReplyTarget(null)
      load()
      getAdminSupportTicketStats().then(setStats).catch(() => {})
    } catch { /* keep modal open on failure */ } finally {
      setReplySaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Support</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Support Inbox</h1>
        <p className="text-sm text-ink/50 mt-1">Messages submitted from the User Portal's Help & Support page.</p>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Open Tickets</p>
              <div className="w-9 h-9 rounded-lg bg-amber/20 text-amber-700 flex items-center justify-center shrink-0"><Inbox size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-navy mt-1">{stats.openCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Urgent</p>
              <div className="w-9 h-9 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0"><AlertTriangle size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-navy mt-1">{stats.urgentCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Resolved Today</p>
              <div className="w-9 h-9 rounded-lg bg-green/10 text-green flex items-center justify-center shrink-0"><CheckCircle2 size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-navy mt-1">{stats.resolvedToday}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All Statuses" options={STATUS_OPTIONS} />
        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
          <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
          Urgent only
        </label>
        <span className="ml-auto text-sm text-ink/40">{total} ticket{total === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-line py-16 text-center">
          <MessageSquare size={32} className="text-ink/20 mx-auto mb-3" />
          <p className="text-ink/40 text-sm">No tickets match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-line p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">{SUBJECT_LABELS[t.subject] ?? t.subject}</span>
                    {t.is_urgent && <Badge variant="red" label="Urgent" />}
                    <Badge variant={t.status === 'resolved' ? 'green' : 'amber'} label={t.status === 'resolved' ? 'Resolved' : 'Open'} />
                  </div>
                  <p className="text-sm font-medium text-ink">{t.user_name} <span className="text-ink/40 font-normal">· {t.user_email}</span></p>
                  <p className="text-sm text-ink/70 mt-1.5">{t.message}</p>
                  <p className="text-xs text-ink/40 mt-1.5">{fmtDate(t.created_at)}</p>
                  {t.admin_reply && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <p className="text-xs font-semibold text-green mb-1">Your reply:</p>
                      <p className="text-sm text-ink/70">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
                <Button variant={t.status === 'resolved' ? 'secondary' : 'primary'} onClick={() => openReply(t)} className="shrink-0">
                  {t.status === 'resolved' ? 'Edit Reply' : 'Reply'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to Ticket">
        {replyTarget && (
          <form onSubmit={submitReply} className="space-y-4">
            <div className="rounded-lg bg-concrete p-3">
              <p className="text-xs text-ink/40 mb-1">{replyTarget.user_name} asked:</p>
              <p className="text-sm text-ink/70">{replyTarget.message}</p>
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
              <Button type="submit" loading={replySaving}>Send Reply & Resolve</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
