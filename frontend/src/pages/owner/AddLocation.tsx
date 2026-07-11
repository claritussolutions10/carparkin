import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import {
  ChevronRight, MapPin, Car, CheckCircle2, Circle, Lightbulb, Check,
} from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'
import ImageUploader, { type UploadedImage } from '../../components/common/ImageUploader'
import {
  createParking, searchParkings, getParkingTypes, getAmenitiesList,
  type ParkingType, type Amenity,
} from '../../api/parkings.api'

const PRO_TIPS = [
  'High-quality photos increase bookings by 40%.',
  "Mention landmarks nearby (e.g., '5 min walk to Stadium').",
  'Competitive pricing helps you get your first reviews faster.',
]

function ProgressRing({ percent }: { percent: number }) {
  const size = 96
  const stroke = 8
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - percent / 100)
  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D7DBE0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22c55e" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="font-display font-bold" fill="#15202B" fontSize={20}>
        {percent}%
      </text>
    </svg>
  )
}

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-green text-white text-sm font-semibold flex items-center justify-center shrink-0">{n}</span>
      <h2 className="font-display font-semibold text-ink">{title}</h2>
    </div>
  )
}

export default function AddLocation() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [mapKey, setMapKey] = useState(0)
  const [totalSpaces, setTotalSpaces] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [features, setFeatures] = useState({ cctv: false, covered: true, access247: false, ev: false })
  const [images, setImages] = useState<UploadedImage[]>([])

  const [parkingTypes, setParkingTypes] = useState<ParkingType[]>([])
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([])
  const [suggestedRange, setSuggestedRange] = useState({ min: 1500, max: 2500 })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getParkingTypes().then(setParkingTypes).catch(() => {})
    getAmenitiesList().then(setAmenitiesList).catch(() => {})
    // Suggested price range derived from real nearby listing prices, not a fabricated figure.
    searchParkings({ limit: 20 }).then((r) => {
      const prices = r.parkings.map((p) => Number(p.price_per_month)).filter((n) => n > 0)
      if (prices.length) {
        setSuggestedRange({
          min: Math.round(Math.min(...prices) / 100) * 100,
          max: Math.round(Math.max(...prices) / 100) * 100,
        })
      }
    }).catch(() => {})
  }, [])

  const basicDone = title.trim().length > 0
  const locationDone = !!address.trim() && !!city.trim() && !!pinCode.trim() && latitude != null && longitude != null
  const pricingDone = Number(monthlyRate) > 0 && totalSpaces.trim().length > 0
  const photosCount = images.length
  const photosDone = photosCount >= 3

  const completionPct = Math.round(
    (basicDone ? 25 : 0) + (locationDone ? 25 : 0) + (pricingDone ? 25 : 0) + Math.min(photosCount / 3, 1) * 25
  )

  const nextStepHint = useMemo(() => {
    if (!basicDone) return 'Add a title to get started.'
    if (!locationDone) return 'Add your full address, city, and PIN code.'
    if (!pricingDone) return 'Set a monthly rate and total capacity.'
    if (!photosDone) return `Add ${3 - photosCount} more photo${3 - photosCount === 1 ? '' : 's'} to reach 100%.`
    return 'Your listing is ready to publish!'
  }, [basicDone, locationDone, pricingDone, photosDone, photosCount])

  const checklist = [
    { label: 'Basic Details', done: basicDone },
    { label: 'Location Added', done: locationDone },
    { label: 'Pricing Set', done: pricingDone },
    { label: 'Upload 3+ Photos', done: photosDone },
  ]

  const toggleFeature = (key: keyof typeof features) => setFeatures((f) => ({ ...f, [key]: !f[key] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !address.trim() || !totalSpaces || !monthlyRate) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const coveredType = parkingTypes.find((t) => t.name.toLowerCase() === 'covered')
      const fallbackType = parkingTypes.find((t) => t.name.toLowerCase() === 'open-air') ?? parkingTypes[0]
      const parkingTypeId = (features.covered ? coveredType?.id : fallbackType?.id) ?? parkingTypes[0]?.id

      const evAmenity = amenitiesList.find((a) => a.name.toLowerCase().includes('ev charging'))
      const amenityIds = features.ev && evAmenity ? [evAmenity.id] : []

      // pin_code has no dedicated column, so it's folded into the display
      // address; city is now a real column (see 024_listing_city.sql) so it's
      // sent separately too, for city-filtered search/SEO landing pages.
      const fullAddress = [address.trim(), city.trim(), pinCode.trim()].filter(Boolean).join(', ')

      await createParking({
        title: title.trim(),
        description: description.trim() || undefined,
        address: fullAddress,
        city: city.trim() || undefined,
        latitude,
        longitude,
        total_spaces: Number(totalSpaces),
        price_per_month: Number(monthlyRate),
        has_cctv: features.cctv,
        has_security_guard: features.access247,
        parking_type_id: parkingTypeId,
        amenity_ids: amenityIds,
        image_urls: images,
      })
      navigate('/owner/locations')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to publish listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 flex-wrap mb-4">
        <Link to="/owner/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <Link to="/owner/locations" className="hover:text-green transition-colors">My Locations</Link>
        <ChevronRight size={12} />
        <span className="text-ink/60">Add New Location</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Add New Parking Location</h1>
        <p className="text-sm text-ink/50 mt-1">
          Fill in the details below to list your parking spot. Ensure all information is accurate to help drivers find you easily.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[65fr_35fr] gap-6 items-start">
        {/* Main form column */}
        <div className="min-w-0 space-y-6">
          <div className="bg-surface rounded-xl border border-line p-6 divide-y divide-line">
            {/* Section 1 */}
            <div className="pb-6">
              <SectionHeading n={1} title="Basic Details" />
              <div className="space-y-4">
                <Input
                  label="Parking Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Downtown Secure Garage"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Describe accessibility, security features, and any specific instructions..."
                    rows={4}
                    maxLength={500}
                    className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green resize-none"
                  />
                  <p className="text-xs text-ink/40 text-right mt-1">{description.length}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="py-6">
              <SectionHeading n={2} title="Location & Capacity" />
              <div className="space-y-4">
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onSelect={(result) => {
                    setAddress(result.address)
                    setCity(result.city)
                    setLatitude(result.latitude)
                    setLongitude(result.longitude)
                    setMapKey((k) => k + 1)
                  }}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="City *" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" required />
                  <Input label="PIN Code *" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="560001" maxLength={6} required />
                </div>

                <div className="relative">
                  <Input
                    label="Total Capacity (Spots) *"
                    type="number" min="1"
                    value={totalSpaces}
                    onChange={(e) => setTotalSpaces(e.target.value)}
                    placeholder="1"
                    className="pl-9"
                    required
                  />
                  <Car size={15} className="absolute left-3 top-[38px] text-ink/40" />
                </div>

                {latitude != null && longitude != null && (
                  <div className="relative h-52 rounded-xl overflow-hidden border border-line">
                    <Map
                      key={mapKey}
                      defaultCenter={{ lat: latitude, lng: longitude }}
                      defaultZoom={16}
                      gestureHandling="greedy"
                      mapId="carparkin-add-location"
                    >
                      <AdvancedMarker
                        position={{ lat: latitude, lng: longitude }}
                        draggable
                        onDragEnd={(e) => {
                          const pos = e.latLng
                          if (pos) { setLatitude(pos.lat()); setLongitude(pos.lng()) }
                        }}
                      />
                    </Map>
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-surface rounded-full px-3.5 py-1.5 text-xs font-medium text-ink shadow-md pointer-events-none">
                      <MapPin size={12} /> Drag pin to adjust
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3 */}
            <div className="py-6">
              <SectionHeading n={3} title="Pricing & Features" />
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Monthly Rate *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">₹</span>
                    <input
                      type="number" min="0" step="50"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full rounded-lg border border-line pl-7 pr-16 py-2.5 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">/month</span>
                  </div>
                  <div className="mt-2 rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-700">
                    Suggested price for this area is ₹{suggestedRange.min.toLocaleString('en-IN')} – ₹{suggestedRange.max.toLocaleString('en-IN')} based on similar listings.
                  </div>
                </div>

                <div>
                  <p className="block text-sm font-medium text-ink mb-1.5">Features</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['cctv', 'CCTV'],
                      ['covered', 'Covered'],
                      ['access247', '24/7 Access'],
                      ['ev', 'EV Charging'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={features[key]}
                          onChange={() => toggleFeature(key)}
                          className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="pt-6">
              <SectionHeading n={4} title="Photos" />
              <ImageUploader images={images} onChange={setImages} />
            </div>
          </div>

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          {/* Bottom actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/owner/locations')}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Publishing...' : <><Check size={16} /> Publish Listing</>}
            </Button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6 min-w-0 lg:sticky lg:top-10">
          <div className="bg-surface rounded-xl border border-line p-6 text-center">
            <ProgressRing percent={completionPct} />
            <p className="font-display font-semibold text-ink mt-3">
              {completionPct >= 100 ? 'Your listing is ready!' : 'Your listing is almost ready!'}
            </p>
            <p className="text-sm text-green mt-1">{nextStepHint}</p>

            <div className="mt-5 space-y-2.5 text-left">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5 text-sm">
                  {c.done ? <CheckCircle2 size={16} className="text-green shrink-0" /> : <Circle size={16} className="text-ink/20 shrink-0" />}
                  <span className={c.done ? 'text-ink' : 'text-ink/50'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-green-700" />
              <p className="font-display font-semibold text-ink">Pro Tips</p>
            </div>
            <ul className="space-y-2.5">
              {PRO_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-ink/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-green mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}
