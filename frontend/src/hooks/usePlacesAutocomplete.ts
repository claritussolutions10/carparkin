import { useEffect, useRef, type RefObject } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

// Shared by AddressAutocomplete (owner listing forms) and LocationAutocomplete
// (driver search bars) - both just wrap a Google Places Autocomplete on a plain
// input and need the same listener setup/cleanup, only the onPlaceChanged
// handler and the fields requested differ.
export function usePlacesAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onPlaceChanged: (place: google.maps.places.PlaceResult) => void,
  options?: google.maps.places.AutocompleteOptions
) {
  const places = useMapsLibrary('places')
  const onPlaceChangedRef = useRef(onPlaceChanged)
  onPlaceChangedRef.current = onPlaceChanged

  useEffect(() => {
    if (!places || !inputRef.current) return

    const ac = new places.Autocomplete(inputRef.current, options)
    ac.addListener('place_changed', () => onPlaceChangedRef.current(ac.getPlace()))

    return () => {
      google.maps.event.clearInstanceListeners(ac)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places])
}
