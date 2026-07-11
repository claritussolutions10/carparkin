import { useEffect, useRef, useState } from 'react'
import {
  Search, ChevronDown, Mail, Phone, MessageCircle, Send,
  CreditCard, User, CalendarDays, Users, ArrowRight,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import { getPublicConfig, type PublicConfig } from '../../api/config.api'
import { createSupportTicket, getMySupportTickets, type SupportTicket } from '../../api/user.api'

const TOPICS = [
  { key: 'billing', icon: CreditCard, title: 'Billing', caption: 'Invoices, refunds & payment methods' },
  { key: 'account', icon: User, title: 'Account', caption: 'Profile settings & password reset' },
  { key: 'bookings', icon: CalendarDays, title: 'Bookings', caption: 'Cancellations, extensions & access' },
]

const FAQS = [
  {
    id: 'cancel-subscription',
    question: 'How do I cancel my monthly subscription?',
    answer: 'Go to My Bookings, find the active booking, and select "Manage" → "Cancel". Cancellations made more than 24 hours before the next billing date take effect immediately; otherwise the current period runs out first.',
  },
  {
    id: 'lot-full',
    question: 'What if the parking lot is full when I arrive?',
    answer: 'This shouldn\'t happen for a confirmed monthly spot, but if it does, contact the property owner directly using the details on your booking confirmation, or reach our support team below and we\'ll help resolve it right away.',
  },
  {
    id: 'access-garage',
    question: 'How do I access the parking garage?',
    answer: 'Each active booking has an access code shown on its "View Pass" screen in My Bookings. Present this at the gate or entry panel, or follow any owner-specific instructions sent with your confirmation.',
  },
  {
    id: 'extend-booking',
    question: 'Can I extend my booking time?',
    answer: 'Yes — from My Bookings, open the active booking and select "Renew Plan" to start a new booking for the same spot for the next period, subject to availability.',
  },
]

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'billing', label: 'Billing' },
  { value: 'booking', label: 'Booking Issue' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'other', label: 'Other' },
]

function FaqItem({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div id={id} className="bg-surface rounded-xl border border-line overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink">{question}</span>
        <ChevronDown size={16} className={`text-ink/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-line">
          <p className="text-sm text-ink/60 leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function Support() {
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const faqRef = useRef<HTMLDivElement>(null)

  const loadTickets = () => {
    setTicketsLoading(true)
    getMySupportTickets().then(setTickets).catch(() => {}).finally(() => setTicketsLoading(false))
  }

  useEffect(() => {
    getPublicConfig().then(setConfig).catch(() => {})
    loadTickets()
  }, [])

  const filteredFaqs = FAQS.filter((f) =>
    !search.trim() ||
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase())
  )

  const scrollToFaqs = () => faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSendError('')
    setSending(true)
    try {
      await createSupportTicket({ subject, message: message.trim(), isUrgent: urgent })
      setSent(true)
      setMessage('')
      setUrgent(false)
      setSubject('general')
      loadTickets()
      setTimeout(() => setSent(false), 4000)
    } catch {
      setSendError('Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Help & Support</h1>
          <p className="text-sm text-ink/50 mt-1">Find answers to your questions or contact our team.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface border border-line text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[65fr_35fr] gap-6">
        {/* Left column */}
        <div className="space-y-8 min-w-0">
          {/* Popular Topics */}
          <div>
            <h2 className="font-display text-xl font-bold text-ink mb-4">Popular Topics</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {TOPICS.map((t) => (
                <button
                  key={t.key}
                  onClick={scrollToFaqs}
                  className="bg-surface rounded-xl border border-line p-6 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <t.icon size={20} className="text-green" />
                  </div>
                  <p className="font-display font-semibold text-ink">{t.title}</p>
                  <p className="text-xs text-ink/50 mt-1 leading-relaxed">{t.caption}</p>
                </button>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div ref={faqRef}>
            <h2 className="font-display text-xl font-bold text-ink mb-4">Frequently Asked Questions</h2>
            {filteredFaqs.length === 0 ? (
              <div className="bg-surface rounded-xl border border-line py-12 text-center text-sm text-ink/40">
                No results for "{search}".
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((f) => <FaqItem key={f.id} {...f} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right column (sticky) */}
        <div className="space-y-6 min-w-0 lg:sticky lg:top-10 lg:self-start">
          {/* Send us a message */}
          <div className="bg-surface rounded-xl border border-line p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-green flex items-center justify-center shrink-0">
                <Mail size={16} className="text-white" />
              </div>
              <h2 className="font-display font-semibold text-ink">Send us a message</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1.5">Subject</label>
                <Select options={SUBJECT_OPTIONS} value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30"
                />
                This is an urgent issue
              </label>

              {sent && <p className="text-sm text-green-600">Message sent — we'll get back to you soon.</p>}
              {sendError && <p className="text-sm text-danger">{sendError}</p>}

              <Button type="submit" loading={sending} className="w-full">
                Send Message <Send size={15} />
              </Button>
            </form>
          </div>

          {/* Your Recent Tickets */}
          {!ticketsLoading && tickets.length > 0 && (
            <div className="bg-surface rounded-xl border border-line p-6">
              <h2 className="font-display font-semibold text-ink mb-4">Your Recent Tickets</h2>
              <div className="space-y-4">
                {tickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="border border-line rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                        {SUBJECT_OPTIONS.find((o) => o.value === t.subject)?.label ?? t.subject}
                      </span>
                      <Badge variant={t.status === 'resolved' ? 'green' : 'amber'} label={t.status === 'resolved' ? 'Resolved' : 'Open'} />
                    </div>
                    <p className="text-sm text-ink/70">{t.message}</p>
                    <p className="text-xs text-ink/40 mt-1">{fmtDate(t.created_at)}</p>
                    {t.admin_reply && (
                      <div className="mt-3 pt-3 border-t border-line">
                        <p className="text-xs font-semibold text-green mb-1">Support replied:</p>
                        <p className="text-sm text-ink/70">{t.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Need urgent help? */}
          <div className="bg-green rounded-xl p-6 text-white">
            <p className="font-display font-semibold">Need urgent help?</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Call Support</p>
                <p className="font-display font-bold text-lg leading-tight">{config?.supportPhone ?? '—'}</p>
                <p className="text-xs text-white/70">{config?.supportHours ?? ''}</p>
              </div>
            </div>

            <div className="my-4 border-t border-white/20" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <MessageCircle size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Live Chat</p>
                <button type="button" className="font-semibold underline underline-offset-2 text-left">Start a conversation</button>
                <p className="text-xs text-white/70">Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Community Forum — no forum exists yet, kept as a clearly decorative, non-navigating card */}
          <div className="bg-surface rounded-xl border border-line p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-ink">Community Forum</p>
              <p className="text-xs text-ink/50">Join discussions with other users</p>
            </div>
            <ArrowRight size={16} className="text-ink/30 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
