import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'

interface StaticMapProps {
  latitude: number
  longitude: number
  title?: string
}

export default function StaticMap({ latitude, longitude, title }: StaticMapProps) {
  const center = { lat: latitude, lng: longitude }

  return (
    <div className="h-64 rounded-lg border border-line overflow-hidden">
      <Map
        defaultCenter={center}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="carparkin-detail-map"
      >
        <AdvancedMarker position={center} title={title} />
      </Map>
    </div>
  )
}
