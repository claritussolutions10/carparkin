import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Copy, MapPin, Car, Calendar, ExternalLink } from 'lucide-react'
import client from '../../api/client'
import Navbar from '../../components/layout/Navbar'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }

export default function BookingConfirmation() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = params.get('bookingId') ?? ''

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!bookingId) { navigate('/bookings'); return }
    client.get(`/bookings/${bookingId}`)
      .then((r) => setBooking(r.data.booking))
      .catch(() => navigate('/bookings'))
      .finally(() => setLoading(false))
  }, [bookingId, navigate])

  const copyId = () => {
    navigator.clipboard.writeText(bookingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-concrete">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-32 bg-surface rounded-xl" />
        <div className="h-48 bg-surface rounded-xl" />
      </div>
    </div>
  )

  if (!booking) return null

  return (
    <div className="min-h-screen bg-concrete pb-16">
      <Navbar />

      {/* Success banner */}
      <div className="bg-green-500 py-10 text-center text-white">
        <CheckCircle2 size={52} className="mx-auto mb-3" />
        <h1 className="font-display text-3xl font-semibold">Booking Confirmed!</h1>
        <p className="text-white/80 mt-1">Your parking reservation is all set.</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">

        {/* Booking ID */}
        <div className="bg-surface rounded-xl border border-line p-5">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-1">Booking Reference</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm text-ink break-all flex-1">{bookingId}</p>
            <button onClick={copyId} className="p-1.5 rounded-lg hover:bg-concrete text-ink/40 hover:text-ink transition-colors shrink-0">
              <Copy size={14} />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
        </div>

        {/* Booking details */}
        <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <h2 className="font-display font-semibold text-ink">Booking Details</h2>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-ink" />
            </div>
            <div>
              <p className="text-xs text-ink/40">Parking</p>
              <p className="text-sm font-medium text-ink">{booking.listing_title}</p>
              <p className="text-xs text-ink/50">{booking.listing_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar size={14} className="text-ink" />
            </div>
            <div>
              <p className="text-xs text-ink/40">Dates</p>
              <p className="text-sm font-medium text-ink">
                {fmtDate(booking.booking_start_date)} → {fmtDate(booking.booking_end_date)}
              </p>
              <p className="text-xs text-ink/50">{booking.duration_days} days</p>
            </div>
          </div>

          {booking.make && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                <Car size={14} className="text-ink" />
              </div>
              <div>
                <p className="text-xs text-ink/40">Vehicle</p>
                <p className="text-sm font-medium text-ink">{booking.make} {booking.model}</p>
                <p className="text-xs font-mono text-ink/50">{booking.registration_number}</p>
              </div>
            </div>
          )}

          <div className="border-t border-line pt-4 flex justify-between items-center">
            <span className="text-sm text-ink/50">Total Paid</span>
            <span className="font-display font-semibold text-lg text-ink">{fmt(booking.total_price)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} /> {booking.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-surface rounded-xl border border-line p-5">
          <h2 className="font-display font-semibold text-ink mb-4">What happens next?</h2>
          <ol className="space-y-3">
            {[
              'A confirmation email has been sent to your email address.',
              'Contact the parking owner for access instructions.',
              `Check in on ${fmtDate(booking.booking_start_date)} and start using your space.`,
              'Manage your booking anytime from your dashboard.',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink/70">
                <span className="w-5 h-5 rounded-full bg-navy/10 text-ink text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/bookings"
            className="w-full flex items-center justify-center gap-2 bg-navy text-white font-medium py-3 rounded-xl hover:bg-navy-light transition-colors">
            <ExternalLink size={16} /> View My Bookings
          </Link>
          <Link to="/"
            className="w-full text-center text-sm text-ink/50 hover:text-ink py-2 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
