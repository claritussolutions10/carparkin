import { useRef, useEffect, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

interface AddressResult {
  address: string
  city: string
  latitude: number
  longitude: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (result: AddressResult) => void
}

export default function AddressAutocomplete({ value, onChange, onSelect }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const places = useMapsLibrary('places')
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!places || !inputRef.current) return

    const ac = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'address_components'],
    })

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return

      const city = place.address_components?.find(
        (c) => c.types.includes('locality')
      )?.long_name || ''

      onSelect({
        address: place.formatted_address || '',
        city,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      })
    })

    setAutocomplete(ac)

    return () => {
      google.maps.event.clearInstanceListeners(ac)
    }
  }, [places])

  // Sync value prop changes to the input (for edit mode pre-fill)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value && !autocomplete) {
      inputRef.current.value = value
    }
  }, [value, autocomplete])

  return (
    <div className="space-y-1.5">
      <label htmlFor="address-autocomplete" className="block text-sm font-medium text-ink">
        Address
      </label>
      <input
        ref={inputRef}
        id="address-autocomplete"
        type="text"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing an address..."
        required
        className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
      />
    </div>
  )
}
