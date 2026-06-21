import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { createParking, updateParking, getOwnerParking } from '../../api/parkings.api'
import ImageUploader from '../../components/common/ImageUploader'
import AddressAutocomplete from '../../components/common/AddressAutocomplete'

const AMENITY_OPTIONS = ['CCTV', 'Covered', 'Security Guard', 'EV Charging', '24/7 Access', 'Well Lit', 'Near Metro']

export default function ParkingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [amenities, setAmenities] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getOwnerParking(Number(id))
      .then((p) => {
        setTitle(p.title)
        setDescription(p.description || '')
        setAddress(p.address)
        setCity(p.city)
        setMonthlyPrice(String(p.monthly_price))
        setCapacity(String(p.capacity))
        setLatitude(p.latitude ?? undefined)
        setLongitude(p.longitude ?? undefined)
        setAmenities(p.amenities)
        setImages(p.images)
      })
      .catch(() => setError('Failed to load parking'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const data = {
      title,
      description: description || undefined,
      address,
      city,
      latitude,
      longitude,
      monthlyPrice: parseInt(monthlyPrice),
      capacity: parseInt(capacity),
      amenities,
      images,
    }

    try {
      if (isEdit) {
        await updateParking(Number(id), data)
      } else {
        await createParking(data)
      }
      navigate('/owner/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-concrete">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-10 bg-white rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {isEdit ? 'Edit Parking' : 'Add Parking'}
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            {isEdit ? 'Update your parking listing details.' : 'List a new parking location.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-line p-6 space-y-5">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Skyline Apartment Parking" required />

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-ink">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Covered parking with 24/7 security..."
              rows={3}
              className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber/60 focus:border-navy resize-none"
            />
          </div>

          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={(result) => {
              setAddress(result.address)
              setCity(result.city)
              setLatitude(result.latitude)
              setLongitude(result.longitude)
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" required />
            <Input label="Monthly Price (₹)" type="number" min="1" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} placeholder="2500" required />
          </div>

          <Input label="Capacity (spots)" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="25" required />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    amenities.includes(a)
                      ? 'bg-navy text-white'
                      : 'bg-concrete text-ink/60 hover:text-ink hover:border-navy border border-transparent'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <ImageUploader images={images} onChange={setImages} />

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Parking'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/owner/dashboard')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
