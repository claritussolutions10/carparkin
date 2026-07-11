import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { Pencil, Car, MapPin } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import {
  getUserDashboard, getUserBookingById, getUserBookings, getVehicles, cancelUserBooking,
  type UserDashboard, type UserBooking, type Vehicle,
} from '../../api/user.api'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotificationBell from '../../components/common/NotificationBell'
import { accessCode } from '../../lib/bookingHelpers'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function UserDashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState<UserDashboard | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [currentBooking, setCurrentBooking] = useState<UserBooking | null>(null)
  const [history, setHistory] = useState<UserBooking[]>([])
  const [daysParked, setDaysParked] = useState(0)
  const [loading, setLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let ignore = false
    Promise.all([getUserDashboard(), getVehicles(), getUserBookings({ limit: 50 })])
      .then(async ([dash, vehicles, bookingsPage]) => {
        if (ignore) return
        setDashboard(dash)
        setVehicle(vehicles.find((v) => v.is_primary) ?? vehicles[0] ?? null)
        setDaysParked(
          bookingsPage.bookings
            .filter((b) => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (b.duration_days || 0), 0)
        )

        const active = dash.upcomingBookings[0]
        if (active) {
          const full = await getUserBookingById(active.id)
          if (!ignore) setCurrentBooking(full)
          setHistory(bookingsPage.bookings.filter((b) => b.id !== active.id).slice(0, 3))
        } else {
          setHistory(bookingsPage.bookings.slice(0, 3))
        }
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const handleCancel = async () => {
    if (!currentBooking) return
    setCancelling(true)
    try {
      await cancelUserBooking(currentBooking.id)
      setCurrentBooking({ ...currentBooking, status: 'cancelled' })
      setCancelOpen(false)
    } catch { /* keep dialog open on failure */ } finally { setCancelling(false) }
  }

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-green mt-1">Here is what's happening with your parking today.</p>
        </div>
        <div className="shrink-0">
          <NotificationBell />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 h-40 bg-surface rounded-xl border border-line animate-pulse" />
          <div className="h-40 bg-surface rounded-xl border border-line animate-pulse" />
        </div>
      ) : (
        <>
          {/* Profile + Savings row */}
          <div className="grid md:grid-cols-[65fr_35fr] gap-6 mb-8">
            <div className="bg-surface rounded-xl border border-line p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center font-display text-xl font-semibold">
                    {user?.full_name?.[0] ?? 'U'}
                  </div>
                  <Link
                    to="/user/profile"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green border-2 border-white flex items-center justify-center text-white"
                    aria-label="Edit profile"
                  >
                    <Pencil size={11} />
                  </Link>
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink truncate">{user?.full_name}</p>
                  <p className="text-sm text-ink/50 truncate">{user?.email}</p>
                  {vehicle && (
                    <Link
                      to="/user/vehicles"
                      className="mt-2 inline-flex items-center gap-1.5 bg-concrete rounded-full px-3 py-1 text-xs text-ink/70 hover:bg-line/60 transition-colors"
                    >
                      <Car size={12} />
                      {vehicle.make} {vehicle.model} (<span className="font-mono">{vehicle.registration_number}</span>)
                    </Link>
                  )}
                </div>
              </div>
              <Link to="/user/profile" className="shrink-0">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </div>

            <div className="bg-green rounded-xl p-6 text-white flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total Spent</p>
                <p className="mt-1 font-display text-3xl font-bold">{fmt(dashboard?.totalSpent ?? 0)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <p className="text-white/70 text-xs">Days Parked</p>
                  <p className="font-semibold">{daysParked}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs">Next Due</p>
                  <p className="font-semibold">{currentBooking ? fmtDate(currentBooking.booking_end_date) : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Booking */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold text-ink">Current Booking</h2>
              <Link to="/find-parking" className="text-sm font-medium text-green hover:text-green-light transition-colors">
                Find New Spot
              </Link>
            </div>

            {currentBooking ? (
              <div className="bg-surface rounded-xl border border-line overflow-hidden grid md:grid-cols-2">
                <div className="relative h-48 md:h-full min-h-[220px]">
                  {currentBooking.latitude != null && currentBooking.longitude != null ? (
                    <Map
                      defaultCenter={{ lat: Number(currentBooking.latitude), lng: Number(currentBooking.longitude) }}
                      defaultZoom={15}
                      disableDefaultUI
                      gestureHandling="none"
                      mapId="carparkin-current-booking"
                    >
                      <AdvancedMarker position={{ lat: Number(currentBooking.latitude), lng: Number(currentBooking.longitude) }} />
                    </Map>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                      <MapPin className="text-white/25" size={32} />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                        {currentBooking.status === 'confirmed' ? 'Active' : currentBooking.status}
                      </span>
                      <p className="mt-1 text-xs text-ink/40">Monthly Plan</p>
                    </div>
                    <div className="bg-concrete rounded-lg px-3 py-2 text-center shrink-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">Access Code</p>
                      <p className="font-mono text-xl font-bold text-ink">{accessCode(currentBooking.id)}</p>
                    </div>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-semibold text-ink">{currentBooking.listing_title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink/50">
                    <MapPin size={13} className="shrink-0" />
                    {currentBooking.address ?? currentBooking.listing_address}
                  </p>

                  <div className="mt-4 pt-4 border-t border-line flex items-end justify-between flex-wrap gap-4">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-ink/40">Valid Until</p>
                        <p className="text-sm font-medium text-ink">{fmtDate(currentBooking.booking_end_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink/40">Monthly Rate</p>
                        <p className="text-sm font-medium text-ink">
                          {currentBooking.price_per_month != null ? fmt(currentBooking.price_per_month) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="!text-danger !border-danger/40 hover:!border-danger"
                        onClick={() => setCancelOpen(true)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => navigate(`/booking?listing=${currentBooking.listing_id}`)}>
                        Renew Plan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-xl border border-line p-10 text-center">
                <Car size={36} className="text-ink/20 mx-auto mb-3" />
                <p className="font-medium text-ink">No active booking</p>
                <p className="text-sm text-ink/50 mt-1 mb-4">Find a monthly parking spot to get started.</p>
                <Link to="/find-parking"><Button>Find Parking</Button></Link>
              </div>
            )}
          </div>

          {/* Recent History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-bold text-ink">Recent History</h2>
              <Link to="/bookings" className="text-sm font-medium text-green hover:text-green-light transition-colors">
                View All →
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="bg-surface rounded-xl border border-line py-12 text-center text-sm text-ink/40">
                No past bookings yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {history.map((b) => {
                  const expired = b.status === 'completed'
                  return (
                    <div key={b.id} className="bg-surface rounded-xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-concrete flex items-center justify-center text-ink/40 font-display font-bold text-sm">
                          P
                        </div>
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            expired
                              ? 'bg-concrete text-ink/50'
                              : b.status === 'cancelled'
                                ? 'bg-red-100 text-danger'
                                : 'bg-amber/10 text-amber-700'
                          }`}
                        >
                          {expired ? 'Expired' : b.status}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display font-semibold text-ink truncate">{b.listing_title ?? 'Parking'}</h3>
                      <p className="text-xs text-ink/50 mt-1">
                        {fmtDate(b.booking_start_date)} – {fmtDate(b.booking_end_date)}
                      </p>
                      <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                        <p className="font-display font-semibold text-ink">{fmt(b.total_price)}</p>
                        {b.listing_id && (
                          <Link
                            to={`/parking/${b.listing_id}`}
                            className="text-sm font-medium text-green hover:text-green-light transition-colors"
                          >
                            Re-book
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel booking"
        message="Are you sure you want to cancel your current booking? This cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
        loading={cancelling}
      />
    </div>
  )
}
