import { useRef, useEffect, type InputHTMLAttributes } from 'react'
import { usePlacesAutocomplete } from '../../hooks/usePlacesAutocomplete'

interface LocationResult {
  description: string
  lat: number
  lng: number
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (result: LocationResult) => void
  placeholder?: string
  className?: string
  inputProps?: InputHTMLAttributes<HTMLInputElement>
}

// Bare-input variant of AddressAutocomplete for driver-facing search bars,
// which already own the icon/border/wrapper markup around the field.
export default function LocationAutocomplete({
  value, onChange, onSelect, placeholder, className, inputProps,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  usePlacesAutocomplete(
    inputRef,
    (place) => {
      if (!place.geometry?.location) return
      onSelect({
        description: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      })
    },
    { componentRestrictions: { country: 'in' }, fields: ['formatted_address', 'geometry'] }
  )

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      {...inputProps}
    />
  )
}
