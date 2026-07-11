import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Car, CalendarDays, CheckCircle2, Star } from 'lucide-react'
import { getParkingById, type Parking } from '../../api/parkings.api'
import { getVehicles, type Vehicle } from '../../api/user.api'
import { checkAvailability, getPricingEstimate, createBooking, type PricingEstimate } from '../../api/bookings.api'
import Button from '../../components/common/Button'
import Navbar from '../../components/layout/Navbar'
import DateRangePicker from '../../components/common/DateRangePicker'
import { toISO } from '../../lib/dateUtils'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }

const STEPS = ['Select Dates', 'Choose Vehicle', 'Confirm & Pay']

export default function BookingFlow() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const listingId = params.get('listing') ?? ''

  const [step, setStep] = useState(0)
  const [parking, setParking] = useState<Parking | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [estimate, setEstimate] = useState<PricingEstimate | null>(null)
  const [availability, setAvailability] = useState<{ isAvailable: boolean; availableSpaces: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!listingId) { navigate('/search'); return }
    Promise.all([
      getParkingById(listingId),
      getVehicles(),
    ]).then(([p, v]) => {
      setParking(p)
      setVehicles(v)
      if (v.length > 0) setSelectedVehicle(v.find((x) => x.is_primary) ?? v[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [listingId, navigate])

  const checkDates = async () => {
    if (!startDate || !endDate) { setError('Please select both dates.'); return false }
    if (endDate <= startDate) { setError('Check-out must be after check-in.'); return false }
    setError('')
    setChecking(true)
    try {
      const [avail, price] = await Promise.all([
        checkAvailability(listingId, startDate, endDate),
        getPricingEstimate(listingId, startDate, endDate),
      ])
      setAvailability(avail)
      setEstimate(price)
      if (!avail.isAvailable) { setError('No spaces available for these dates.'); return false }
      return true
    } catch {
      setError('Failed to check availability. Please try again.')
      return false
    } finally { setChecking(false) }
  }

  const handleNext = async () => {
    if (step === 0) {
      const ok = await checkDates()
      if (!ok) return
    }
    if (step === 1 && !selectedVehicle) {
      setError('Please select a vehicle.')
      return
    }
    setError('')
    setStep((s) => s + 1)
  }

  const handleBook = async () => {
    if (!selectedVehicle || !estimate) return
    setSubmitting(true)
    setError('')
    try {
      const { booking } = await createBooking({
        listingId,
        vehicleId: selectedVehicle.id,
        startDate,
        endDate,
      })
      navigate(`/booking/payment?bookingId=${booking.id}&amount=${booking.total_price}`)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create booking. Please try again.')
    } finally { setSubmitting(false) }
  }

  const today = toISO(new Date())

  if (loading) return (
    <div className="min-h-screen bg-concrete">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12 animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-surface rounded" />
        <div className="h-48 bg-surface rounded-xl" />
      </div>
    </div>
  )

  if (!parking) return (
    <div className="min-h-screen bg-concrete">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-ink/50">Listing not found. <Link to="/search" className="text-ink hover:underline">Search again</Link></p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-concrete pb-16">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)}
              className="p-2 rounded-lg hover:bg-surface border border-line transition-colors">
              <ChevronLeft size={18} className="text-ink" />
            </button>
          ) : (
            <Link to={`/parking/${listingId}`}
              className="p-2 rounded-lg hover:bg-surface border border-line transition-colors">
              <ChevronLeft size={18} className="text-ink" />
            </Link>
          )}
          <div className="flex-1">
            <p className="text-xs text-ink/40 uppercase tracking-wide">Step {step + 1} of {STEPS.length}</p>
            <h1 className="font-display font-semibold text-ink">{STEPS[step]}</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-navy' : 'bg-line'}`} />
          ))}
        </div>

        {/* Parking summary strip */}
        <div className="bg-surface rounded-xl border border-line px-4 py-3 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{parking.title}</p>
            <p className="text-xs text-ink/50 truncate">{parking.address}</p>
          </div>
          <p className="font-display font-semibold text-green text-sm shrink-0">{fmt(parking.price_per_month)}<span className="text-xs font-normal text-ink/40">/mo</span></p>
        </div>

        {/* Step content */}
        <div className="bg-surface rounded-xl border border-line overflow-hidden mb-4">

          {/* ── STEP 0: DATES ── */}
          {step === 0 && (
            <div className="p-6 space-y-5">
              <h2 className="font-display font-semibold text-ink">Choose your dates</h2>
              <DateRangePicker
                startValue={startDate}
                endValue={endDate}
                onChangeStart={(v) => { setStartDate(v); setAvailability(null); setEstimate(null) }}
                onChangeEnd={(v) => { setEndDate(v); setAvailability(null); setEstimate(null) }}
                startPlaceholder="Check-in"
                endPlaceholder="Check-out"
                min={today}
              />

              {/* Pricing estimate */}
              {estimate && availability?.isAvailable && (
                <div className="bg-concrete rounded-xl p-4 space-y-2 border border-line">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/60">{estimate.durationDays} days</span>
                    <span className="font-medium text-ink">{fmt(estimate.subtotal)}</span>
                  </div>
                  {Object.entries(estimate.priceBreakdown).map(([type, b]) => (
                    <div key={type} className="flex items-center justify-between text-xs text-ink/50">
                      <span className="capitalize">{type}: {b.count} × {fmt(b.priceEach)}</span>
                      <span>{fmt(b.total)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-line font-display font-semibold">
                    <span className="text-ink">Total</span>
                    <span className="text-ink">{fmt(estimate.totalPrice)}</span>
                  </div>
                </div>
              )}

              {availability && !availability.isAvailable && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 text-sm text-danger">
                  No spaces available for these dates.
                </div>
              )}

              {availability?.isAvailable && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 size={16} /> {availability.availableSpaces} space{availability.availableSpaces !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: VEHICLE ── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              <h2 className="font-display font-semibold text-ink">Select your vehicle</h2>
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car size={40} className="text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/50 mb-4">No vehicles added yet.</p>
                  <Link to="/user/vehicles" className="text-sm font-medium text-ink hover:underline">
                    Add a vehicle →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <button key={v.id} onClick={() => { setSelectedVehicle(v); setError('') }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedVehicle?.id === v.id ? 'border-navy bg-navy/5' : 'border-line hover:border-navy/40'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedVehicle?.id === v.id ? 'bg-navy text-white' : 'bg-concrete text-ink/40'
                      }`}>
                        <Car size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{v.make} {v.model}</p>
                        <p className="text-xs font-mono text-ink/50">{v.registration_number}</p>
                        {v.color && <p className="text-xs text-ink/40 capitalize">{v.color}{v.year_manufactured ? ` · ${v.year_manufactured}` : ''}</p>}
                      </div>
                      {v.is_primary && (
                        <span className="text-xs font-medium text-amber-600 bg-amber/10 px-2 py-0.5 rounded-full shrink-0">
                          <Star size={10} className="inline mr-0.5" fill="currentColor" />Primary
                        </span>
                      )}
                      {selectedVehicle?.id === v.id && (
                        <CheckCircle2 size={18} className="text-ink shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              <Link to="/user/vehicles" className="block text-sm text-ink/60 hover:text-ink hover:underline text-center mt-2">
                + Add another vehicle
              </Link>
            </div>
          )}

          {/* ── STEP 2: CONFIRM ── */}
          {step === 2 && estimate && selectedVehicle && (
            <div className="p-6 space-y-5">
              <h2 className="font-display font-semibold text-ink">Confirm your booking</h2>

              {/* Summary */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/50">Parking</span>
                  <span className="font-medium text-ink text-right max-w-[60%]">{parking.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Check-in</span>
                  <span className="font-medium text-ink">{fmtDate(startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Check-out</span>
                  <span className="font-medium text-ink">{fmtDate(endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Duration</span>
                  <span className="font-medium text-ink">{estimate.durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Vehicle</span>
                  <span className="font-medium text-ink">{selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.registration_number}</span>
                </div>
              </div>

              <div className="border-t border-line pt-4 space-y-2">
                {Object.entries(estimate.priceBreakdown).map(([type, b]) => (
                  <div key={type} className="flex justify-between text-sm text-ink/60">
                    <span className="capitalize">{type} ({b.count} × {fmt(b.priceEach)})</span>
                    <span>{fmt(b.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-ink/60">
                  <span>Platform fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-base font-display font-semibold border-t border-line pt-2">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">{fmt(estimate.totalPrice)}</span>
                </div>
              </div>

              {/* Cancellation policy */}
              <div className="bg-amber/5 border border-amber/20 rounded-lg px-4 py-3 text-xs text-ink/60">
                Free cancellation up to 24 hours before check-in. After that, full charge applies.
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger mb-4 px-1">{error}</p>
        )}

        {/* Action button */}
        {step < 2 ? (
          <Button className="w-full" onClick={handleNext} loading={checking}>
            {checking ? 'Checking availability…' : 'Continue'}
            {!checking && <ChevronRight size={16} />}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleBook} loading={submitting}>
            {submitting ? 'Creating booking…' : `Proceed to Payment · ${estimate ? fmt(estimate.totalPrice) : ''}`}
          </Button>
        )}
      </div>
    </div>
  )
}
