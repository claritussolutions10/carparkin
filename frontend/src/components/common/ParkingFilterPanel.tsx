import { MapPin, RotateCcw } from 'lucide-react'
import Button from './Button'
import { AMENITY_FILTERS, PRICE_MAX, PRICE_MIN, VEHICLE_TYPES, toggleSet } from '../../lib/parkingFilters'

interface PriceRangeSliderProps {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}

function PriceRangeSlider({ min, max, onChange }: PriceRangeSliderProps) {
  const minPct = ((min - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPct = ((max - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  const thumbClasses =
    'absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none ' +
    '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full ' +
    '[&::-webkit-slider-thumb]:bg-green [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white ' +
    '[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 ' +
    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green [&::-moz-range-thumb]:border-2 ' +
    '[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer'

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-line mt-3">
        <div className="absolute h-1.5 rounded-full bg-green" style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }} />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 100), max)}
          className={thumbClasses}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 100))}
          className={thumbClasses}
        />
      </div>
      <div className="flex items-center justify-between gap-3 mt-4">
        <input
          type="number"
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value) || 0, max - 100), max)}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
        />
        <span className="text-ink/30 shrink-0">—</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value) || 0, min + 100))}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
        />
      </div>
    </div>
  )
}

interface ParkingFilterPanelProps {
  location: string
  onLocationChange: (v: string) => void
  minPrice: number
  maxPrice: number
  onPriceChange: (min: number, max: number) => void
  vehicleTypes: Set<string>
  onVehicleTypesChange: (s: Set<string>) => void
  amenities: Set<string>
  onAmenitiesChange: (s: Set<string>) => void
  onApply: () => void
  onReset: () => void
}

export default function ParkingFilterPanel({
  location, onLocationChange,
  minPrice, maxPrice, onPriceChange,
  vehicleTypes, onVehicleTypesChange,
  amenities, onAmenitiesChange,
  onApply, onReset,
}: ParkingFilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-ink">Filters</h2>
        <button onClick={onReset} className="inline-flex items-center gap-1 text-xs font-medium text-ink/40 hover:text-ink/70 transition-colors">
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Location</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. Indiranagar"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-line text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Price Range (₹)</label>
        <PriceRangeSlider min={minPrice} max={maxPrice} onChange={onPriceChange} />
      </div>

      <div>
        <p className="block text-sm font-medium text-ink mb-2">Vehicle Type</p>
        <div className="space-y-2">
          {VEHICLE_TYPES.map((v) => (
            <label key={v.key} className="flex items-center gap-2.5 text-sm text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                checked={vehicleTypes.has(v.key)}
                onChange={() => toggleSet(vehicleTypes, onVehicleTypesChange, v.key)}
                className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30"
              />
              {v.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-ink mb-2">Amenities</p>
        <div className="space-y-2">
          {AMENITY_FILTERS.map((a) => (
            <label key={a.key} className="flex items-center gap-2.5 text-sm text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                checked={amenities.has(a.key)}
                onChange={() => toggleSet(amenities, onAmenitiesChange, a.key)}
                className="w-4 h-4 rounded border-line text-green accent-green focus:ring-green/30"
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <Button onClick={onApply} className="w-full">Apply Filters</Button>
    </div>
  )
}
