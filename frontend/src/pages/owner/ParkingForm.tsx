import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { ChevronRight, MapPin, Car, Star, CalendarOff, Trash2 } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Toggle from '../../components/common/Toggle'
import Badge from '../../components/common/Badge'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'
import ImageUploader, { type UploadedImage } from '../../components/common/ImageUploader'
import DateRangePicker from '../../components/common/DateRangePicker'
import { toISO } from '../../lib/dateUtils'
import {
  getOwnerParking, updateParking, addParkingImages, removeParkingImage,
  getListingBlackouts, addListingBlackout, removeListingBlackout,
  type OwnerParking, type BlackoutDate,
} from '../../api/parkings.api'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function ParkingForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [parking, setParking] = useState<OwnerParking | null>(null)
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [mapKey, setMapKey] = useState(0)
  const [totalSpaces, setTotalSpaces] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')
  const [weeklyRate, setWeeklyRate] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [hasCctv, setHasCctv] = useState(false)
  const [hasSecurityGuard, setHasSecurityGuard] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([])
  const [newUploads, setNewUploads] = useState<UploadedImage[]>([])
  const [imageError, setImageError] = useState('')

  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([])
  const [blackoutStart, setBlackoutStart] = useState('')
  const [blackoutEnd, setBlackoutEnd] = useState('')
  const [blackoutReason, setBlackoutReason] = useState('')
  const [blackoutSaving, setBlackoutSaving] = useState(false)
  const [blackoutError, setBlackoutError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    getOwnerParking(id)
      .then((p) => {
        setParking(p)
        setTitle(p.title)
        setDescription(p.description ?? '')
        setAddress(p.address)
        setCity(p.city ?? '')
        setLatitude(p.latitude != null ? Number(p.latitude) : undefined)
        setLongitude(p.longitude != null ? Number(p.longitude) : undefined)
        setTotalSpaces(String(p.total_spaces))
        setMonthlyRate(String(p.price_per_month))
        setWeeklyRate(p.price_per_week != null ? String(p.price_per_week) : '')
        setDailyRate(p.price_per_day != null ? String(p.price_per_day) : '')
        setHasCctv(p.has_cctv)
        setHasSecurityGuard(p.has_security_guard)
        setIsActive(p.is_active)
        setExistingImages(p.images)
      })
      .catch(() => setFetchError('Could not load this listing. It may not exist, or may not belong to your account.'))
      .finally(() => setFetching(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getListingBlackouts(id).then(setBlackouts).catch(() => {})
  }, [id])

  const submitBlackout = async () => {
    if (!id) return
    setBlackoutError('')
    if (!blackoutStart || !blackoutEnd) { setBlackoutError('Please select both dates.'); return }
    setBlackoutSaving(true)
    try {
      const created = await addListingBlackout(id, { start_date: blackoutStart, end_date: blackoutEnd, reason: blackoutReason.trim() || undefined })
      setBlackouts((prev) => [...prev, created].sort((a, b) => a.start_date.localeCompare(b.start_date)))
      setBlackoutStart('')
      setBlackoutEnd('')
      setBlackoutReason('')
    } catch (err: any) {
      setBlackoutError(err?.response?.data?.error || 'Could not block these dates. Please try again.')
    } finally {
      setBlackoutSaving(false)
    }
  }

  const removeBlackout = async (blackoutId: string) => {
    if (!id) return
    const prev = blackouts
    setBlackouts((cur) => cur.filter((b) => b.id !== blackoutId))
    try {
      await removeListingBlackout(id, blackoutId)
    } catch {
      setBlackouts(prev)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError('')
    if (!title.trim() || !address.trim() || !totalSpaces || !monthlyRate) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      await updateParking(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim() || undefined,
        latitude,
        longitude,
        total_spaces: Number(totalSpaces),
        price_per_month: Number(monthlyRate),
        price_per_week: weeklyRate ? Number(weeklyRate) : undefined,
        price_per_day: dailyRate ? Number(dailyRate) : undefined,
        has_cctv: hasCctv,
        has_security_guard: hasSecurityGuard,
        is_active: isActive,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save changes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewUploads = async (uploaded: UploadedImage[]) => {
    if (!id) return
    setImageError('')
    try {
      const added = await addParkingImages(id, uploaded)
      setExistingImages((prev) => [...prev, ...added.map((a) => ({ id: a.id, url: a.url }))])
      setNewUploads([])
    } catch {
      setImageError('Failed to save photos. Please try again.')
      setNewUploads(uploaded)
    }
  }

  const handleRemoveExisting = async (imageId: string) => {
    if (!id) return
    setImageError('')
    const prev = existingImages
    setExistingImages((cur) => cur.filter((img) => img.id !== imageId))
    try {
      await removeParkingImage(id, imageId)
    } catch {
      setImageError('Failed to remove photo. Please try again.')
      setExistingImages(prev)
    }
  }

  if (fetching) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[65fr_35fr] gap-6">
          <div className="h-96 bg-surface rounded-xl border border-line animate-pulse" />
          <div className="h-64 bg-surface rounded-xl border border-line animate-pulse" />
        </div>
      </div>
    )
  }

  if (fetchError || !parking) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto text-center">
        <p className="text-danger font-medium">{fetchError || 'Listing not found.'}</p>
        <Link to="/owner/locations" className="inline-block mt-4 text-sm font-medium text-green hover:text-green-light transition-colors">
          &larr; Back to My Locations
        </Link>
      </div>
    )
  }

  const approvalStatus = !parking.is_approved ? 'pending' : 'approved'

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 flex-wrap mb-4">
        <Link to="/owner/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <Link to="/owner/locations" className="hover:text-green transition-colors">My Locations</Link>
        <ChevronRight size={12} />
        <span className="text-ink/60">Edit Location</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Edit Parking Location</h1>
        <p className="text-sm text-ink/50 mt-1">Update your listing details. Changes apply immediately.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[65fr_35fr] gap-6 items-start">
        {/* Main form column */}
        <div className="min-w-0 space-y-6">
          <div className="bg-surface rounded-xl border border-line p-6 divide-y divide-line">
            {/* Basic details */}
            <div className="pb-6">
              <h2 className="font-display font-semibold text-ink mb-4">Basic Details</h2>
              <div className="space-y-4">
                <Input label="Parking Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Downtown Secure Garage" required />
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    rows={4}
                    maxLength={500}
                    className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green resize-none"
                  />
                  <p className="text-xs text-ink/40 text-right mt-1">{description.length}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="py-6">
              <h2 className="font-display font-semibold text-ink mb-4">Location & Capacity</h2>
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

                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" />

                <div className="relative">
                  <Input
                    label="Total Capacity (Spots) *"
                    type="number" min="1"
                    value={totalSpaces}
                    onChange={(e) => setTotalSpaces(e.target.value)}
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
                      mapId="carparkin-edit-location"
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

            {/* Pricing */}
            <div className="py-6">
              <h2 className="font-display font-semibold text-ink mb-4">Pricing</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Monthly Rate *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">₹</span>
                    <input
                      type="number" min="0" step="50"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value)}
                      required
                      className="w-full rounded-lg border border-line pl-7 pr-3 py-2.5 font-body text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Weekly Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">₹</span>
                    <input
                      type="number" min="0" step="50"
                      value={weeklyRate}
                      onChange={(e) => setWeeklyRate(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-line pl-7 pr-3 py-2.5 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Daily Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">₹</span>
                    <input
                      type="number" min="0" step="10"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-line pl-7 pr-3 py-2.5 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="pt-6">
              <h2 className="font-display font-semibold text-ink mb-1">Features</h2>
              <p className="text-xs text-ink/40 mb-4">
                Parking type and extra amenities can only be set when a listing is first created — contact support to change those.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
                  <input type="checkbox" checked={hasCctv} onChange={(e) => setHasCctv(e.target.checked)} className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30" />
                  CCTV
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
                  <input type="checkbox" checked={hasSecurityGuard} onChange={(e) => setHasSecurityGuard(e.target.checked)} className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30" />
                  Security Guard
                </label>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-1">Photos</h2>
            <p className="text-xs text-ink/40 mb-4">Changes here save immediately and don't require "Save Changes" below.</p>
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt="" className="h-20 w-20 rounded-lg object-cover border border-line" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUploader images={newUploads} onChange={handleNewUploads} />
            {imageError && <p className="text-xs text-danger mt-2">{imageError}</p>}
          </div>

          <div className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-1">Blocked Dates</h2>
            <p className="text-xs text-ink/40 mb-4">Take this location offline for maintenance over a date range. Changes save immediately.</p>

            {blackouts.length > 0 && (
              <div className="space-y-2 mb-4">
                {blackouts.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarOff size={14} className="text-ink/40 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium">{fmtDate(b.start_date)} – {fmtDate(b.end_date)}</p>
                        {b.reason && <p className="text-xs text-ink/40 truncate">{b.reason}</p>}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeBlackout(b.id)} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/10 transition-colors shrink-0" aria-label="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink/60 mb-1">Dates</label>
                <DateRangePicker
                  startValue={blackoutStart}
                  endValue={blackoutEnd}
                  onChangeStart={setBlackoutStart}
                  onChangeEnd={setBlackoutEnd}
                  min={toISO(new Date())}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={blackoutReason} onChange={(e) => setBlackoutReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 min-w-0 rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
                />
                <Button type="button" onClick={submitBlackout} loading={blackoutSaving} className="shrink-0">Block</Button>
              </div>
            </div>
            {blackoutError && <p className="text-xs text-danger mt-2">{blackoutError}</p>}
          </div>

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          {saved && <p className="rounded-lg bg-green/10 px-3 py-2 text-sm text-green-700">Changes saved.</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/owner/locations')}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6 min-w-0 lg:sticky lg:top-10">
          <div className="bg-surface rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Listing Status</h2>

            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-ink">Visible to renters</p>
                <p className="text-xs text-ink/40 mt-0.5">{isActive ? 'Live and bookable' : 'Hidden from search'}</p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} />
            </div>

            <div className="pt-4 border-t border-line space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink/50">Approval</span>
                <Badge variant={approvalStatus === 'approved' ? 'green' : 'amber'} label={approvalStatus === 'approved' ? 'Approved' : 'Pending Review'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/50">Rating</span>
                <span className="flex items-center gap-1 text-ink font-medium">
                  <Star size={13} className="text-amber fill-amber" /> {parking.rating ? Number(parking.rating).toFixed(1) : '—'} ({parking.review_count})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/50">Available Spaces</span>
                <span className="text-ink font-medium">{parking.available_spaces} / {parking.total_spaces}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
