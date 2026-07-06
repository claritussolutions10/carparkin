import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Share2, Heart, Star, ShieldCheck, Car, MapPin, LayoutGrid,
  Layers, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import StaticMap from '../../components/common/StaticMap'
import DatePicker from '../../components/common/DatePicker'
import { getParkingById, getParkingReviews, type Parking, type ParkingReview } from '../../api/parkings.api'
import { useAuthStore } from '../../store/authStore'

const GALLERY_TILES = [
  'from-navy to-navy-light',
  'from-green to-green-light',
  'from-navy-light to-navy',
  'from-green-light to-green',
  'from-navy to-green',
]

const VEHICLE_TOGGLES = ['Sedan', 'SUV', 'Hatch']

function GalleryTile({ index, className = '' }: { index: number; className?: string }) {
  return (
    <div className={`relative bg-gradient-to-br ${GALLERY_TILES[index % GALLERY_TILES.length]} flex items-center justify-center overflow-hidden ${className}`}>
      <Car className="w-10 h-10 text-white/25" strokeWidth={1.5} />
    </div>
  )
}

function fmtReviewDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

function ReviewsSection({ parkingId, reviewCount }: { parkingId: string; reviewCount: number }) {
  const [reviews, setReviews] = useState<ParkingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 5

  useEffect(() => {
    setLoading(true)
    getParkingReviews(parkingId, { page, limit })
      .then((d) => { setReviews(d.reviews); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [parkingId, page])

  if (!loading && total === 0) return null

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-ink mb-3">Reviews {reviewCount > 0 && `(${reviewCount})`}</h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="h-24 bg-white border border-line rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium shrink-0">
                    {r.reviewer_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{r.reviewer_name}</p>
                    <p className="text-xs text-ink/40">{fmtReviewDate(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={13} className={i < r.rating ? 'text-amber fill-amber' : 'text-line'} />
                  ))}
                </div>
              </div>
              {r.review_text && <p className="text-sm text-ink/70 mt-3">{r.review_text}</p>}
              {r.is_verified_booking && (
                <span className="inline-flex items-center gap-1 text-xs text-green mt-2">
                  <ShieldCheck size={11} /> Verified Booking
                </span>
              )}
              {r.owner_reply && (
                <div className="mt-3 pl-3 border-l-2 border-green/30">
                  <p className="text-xs font-semibold text-ink">Owner's response</p>
                  <p className="text-sm text-ink/70 mt-0.5">{r.owner_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                page === p ? 'bg-green text-white border-green' : 'bg-white border-line text-ink/60 hover:bg-concrete'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ParkingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = !!user

  const [parking, setParking] = useState<Parking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [saved, setSaved] = useState(false)
  const [shared, setShared] = useState(false)

  const [vehicleType, setVehicleType] = useState('Sedan')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [startDate, setStartDate] = useState('')

  useEffect(() => {
    if (!id) return
    getParkingById(id)
      .then(setParking)
      .catch(() => setError('Parking not found'))
      .finally(() => setLoading(false))
  }, [id])

  const goToLogin = () => navigate(`/login?returnTo=${encodeURIComponent(routerLocation.pathname)}`)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: parking?.title, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-6">
          <div className="h-64 bg-white rounded-xl" />
          <div className="h-8 w-1/2 bg-white rounded-lg" />
          <div className="h-4 w-1/3 bg-white rounded" />
          <div className="h-32 bg-white rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !parking) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Parking not found</h2>
          <p className="text-sm text-ink/50 mt-2">This listing may have been removed.</p>
          <Link to="/search" className="inline-block mt-6 text-sm font-medium text-green hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    )
  }

  const amenities = parking.amenities ?? []
  const previewAmenities = amenities.slice(0, 3)
  const securityLevel = parking.has_security_guard ? 'High' : 'Standard'
  const isLowStock = parking.available_spaces > 0 && parking.available_spaces <= 3
  const isFull = parking.available_spaces === 0
  const lat = parking.latitude != null ? Number(parking.latitude) : null
  const lng = parking.longitude != null ? Number(parking.longitude) : null

  return (
    <div className={`min-h-screen bg-concrete ${isAuthenticated ? 'pb-24 lg:pb-8' : ''}`}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        {isAuthenticated ? (
          <nav className="text-sm text-ink/40 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-green transition-colors">Home</Link>
            <span>/</span>
            <Link to="/search" className="hover:text-green transition-colors">Search Results</Link>
            <span>/</span>
            <span className="text-ink/60 truncate max-w-[240px]">{parking.title}</span>
          </nav>
        ) : (
          <nav className="text-sm text-ink/40 flex items-center gap-1.5 flex-wrap">
            <span>Parking</span>
            <span>/</span>
            <Link to="/search" className="hover:text-green transition-colors">Search</Link>
            <span>/</span>
            <span className="text-ink/60 truncate max-w-[240px]">{parking.title}</span>
          </nav>
        )}

        {/* Title row */}
        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div>
            {isAuthenticated ? (
              <>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">{parking.title}</h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap text-sm">
                  <span className="flex items-center gap-1 text-ink/50">
                    <MapPin size={14} /> {parking.address}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-ink">
                    <Star size={14} className="text-amber fill-amber" />
                    {parking.rating != null ? Number(parking.rating).toFixed(1) : 'New'}
                    <span className="text-ink/40 font-normal">({parking.review_count} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                    <ShieldCheck size={12} /> Verified Owner
                  </span>
                </div>
              </>
            ) : (
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">{parking.title}</h1>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink/70 hover:bg-white transition-colors"
              >
                <Share2 size={15} /> {shared ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={() => setSaved((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink/70 hover:bg-white transition-colors"
              >
                <Heart size={15} className={saved ? 'text-danger fill-danger' : ''} /> Save
              </button>
            </div>
          )}
        </div>

        {/* Image gallery */}
        <div className="mt-5">
          {isAuthenticated ? (
            <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-3 h-[360px] rounded-xl overflow-hidden">
              <GalleryTile index={0} className="col-span-2 row-span-2 rounded-xl" />
              <GalleryTile index={1} className="rounded-xl" />
              <GalleryTile index={2} className="rounded-xl" />
              <GalleryTile index={3} className="rounded-xl" />
              <div className="relative rounded-xl overflow-hidden">
                <GalleryTile index={4} />
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="absolute inset-0 bg-black/50 hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 text-white"
                >
                  <LayoutGrid size={20} />
                  <span className="text-sm font-medium">Show all photos</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden sm:block h-[320px] rounded-xl overflow-hidden">
              <GalleryTile index={0} className="w-full h-full" />
            </div>
          )}

          {/* Mobile: single swipeable image */}
          <div className="sm:hidden relative h-56 rounded-xl overflow-hidden">
            <GalleryTile index={activeImage} className="w-full h-full" />
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + GALLERY_TILES.length) % GALLERY_TILES.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % GALLERY_TILES.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-xs px-2.5 py-1">
                  {activeImage + 1} / {GALLERY_TILES.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className={`mt-8 grid gap-8 ${isAuthenticated ? 'lg:grid-cols-3' : ''}`}>
          <div className={isAuthenticated ? 'lg:col-span-2 space-y-8' : 'space-y-8 max-w-3xl'}>
            {isAuthenticated && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-line p-4 text-center">
                  <Layers size={18} className="text-green mx-auto" />
                  <p className="mt-1.5 font-display font-bold text-ink">{parking.total_spaces}</p>
                  <p className="text-xs text-ink/50">Total Slots</p>
                </div>
                <div className="bg-white rounded-xl border border-line p-4 text-center">
                  <Car size={18} className="text-green mx-auto" />
                  <p className="mt-1.5 font-display font-bold text-ink">{parking.available_spaces}</p>
                  <p className="text-xs text-ink/50">Available</p>
                </div>
                <div className="bg-white rounded-xl border border-line p-4 text-center">
                  <Shield size={18} className="text-green mx-auto" />
                  <p className="mt-1.5 font-display font-bold text-ink">{securityLevel}</p>
                  <p className="text-xs text-ink/50">Security</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-display text-lg font-semibold text-ink mb-2">
                {isAuthenticated ? 'About this location' : 'About this space'}
              </h3>
              {parking.description && (
                <p className="text-sm text-ink/60 leading-relaxed">{parking.description}</p>
              )}
              {isAuthenticated && (
                <p className="mt-3 text-sm text-ink/60 leading-relaxed">
                  This is a {(parking.parking_type || 'monthly').toLowerCase()} facility with {parking.total_spaces} total
                  spaces, offering convenient monthly parking near {parking.address}.
                </p>
              )}
            </div>

            {isAuthenticated ? (
              amenities.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenities.map((a) => (
                      <div key={a.id} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-sm text-ink/70">
                        <span className="shrink-0">{a.icon}</span>
                        {a.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              previewAmenities.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewAmenities.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-concrete px-3 py-1.5 text-sm text-ink/70">
                        <span>{a.icon}</span>
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}

            <div>
              <h3 className="font-display text-lg font-semibold text-ink mb-3">Location</h3>
              {lat != null && lng != null ? (
                <div className="relative">
                  <StaticMap latitude={lat} longitude={lng} title={parking.title} />
                  {isAuthenticated && (
                    <button
                      onClick={() => setMapOpen(true)}
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white rounded-full px-3.5 py-1.5 text-xs font-medium text-ink shadow-md"
                    >
                      <MapPin size={13} /> Show on Map
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-white border border-line rounded-lg flex items-center justify-center text-ink/30 text-sm">
                  No location data available
                </div>
              )}
              {isAuthenticated && (
                <p className="mt-2 text-sm text-ink/50">{parking.address}</p>
              )}
            </div>

            <ReviewsSection parkingId={parking.id} reviewCount={parking.review_count} />

            {!isAuthenticated && (
              <div>
                <h3 className="font-display text-lg font-semibold text-ink mb-2">Pricing</h3>
                <p className="text-sm text-ink/60 leading-relaxed">
                  Monthly parking here starts at{' '}
                  <span className="font-semibold text-ink">₹{Number(parking.price_per_month).toLocaleString('en-IN')}/month</span>.
                  Sign in to see live availability, choose your vehicle, and complete a booking.
                </p>
                <Button onClick={goToLogin} className="mt-4">Sign In to view more details</Button>
                <button
                  onClick={goToLogin}
                  className="block mt-4 text-sm text-ink/30 hover:text-ink/50 transition-colors"
                >
                  Proceed to Pay
                </button>
              </div>
            )}
          </div>

          {/* Booking sidebar — logged in only */}
          {isAuthenticated && (
            <aside className="hidden lg:block">
              <div className="bg-white rounded-xl border border-line shadow-sm p-6 sticky top-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl font-bold text-ink">
                      ₹{Number(parking.price_per_month).toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-ink/40"> / month</span>
                    </p>
                  </div>
                  {isLowStock && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 text-danger px-2.5 py-1 text-xs font-medium">
                      🔴 Only {parking.available_spaces} spot{parking.available_spaces !== 1 ? 's' : ''} left!
                    </span>
                  )}
                </div>

                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                />

                <div>
                  <p className="block text-sm font-medium text-ink mb-2">Vehicle Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {VEHICLE_TOGGLES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVehicleType(v)}
                        className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                          vehicleType === v ? 'bg-green text-white border-green' : 'border-line text-ink/60 hover:border-green/40'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Vehicle Number</label>
                  <input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. KA 01 AB 1234"
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink font-mono placeholder:font-body placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                  />
                </div>

                <div className="border-t border-line pt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink/60">Total (1 Month)</span>
                  <span className="font-display font-bold text-ink">
                    ₹{Number(parking.price_per_month).toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  className="w-full"
                  disabled={isFull}
                  onClick={() => navigate(`/booking?listing=${id}`)}
                >
                  {isFull ? 'No spots available' : 'Proceed to Pay →'}
                </Button>
                <p className="text-center text-xs text-ink/40">You won't be charged yet</p>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile booking bar — logged in only */}
      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur-md border-t border-line px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-semibold text-green">
              ₹{Number(parking.price_per_month).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-ink/40">/mo</span>
            </p>
            <p className="text-xs text-ink/50">{parking.available_spaces} spots left</p>
          </div>
          <Button disabled={isFull} onClick={() => navigate(`/booking?listing=${id}`)}>
            {isFull ? 'Full' : 'Book Now'}
          </Button>
        </div>
      )}

      {isAuthenticated && (
        <Modal open={galleryOpen} onClose={() => setGalleryOpen(false)} title="All photos" maxWidth="max-w-3xl">
          <div className="grid grid-cols-2 gap-3">
            {GALLERY_TILES.map((_, i) => (
              <GalleryTile key={i} index={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </Modal>
      )}

      {isAuthenticated && lat != null && lng != null && (
        <Modal open={mapOpen} onClose={() => setMapOpen(false)} title="Map View" maxWidth="max-w-3xl">
          <StaticMap latitude={lat} longitude={lng} title={parking.title} />
        </Modal>
      )}
    </div>
  )
}
