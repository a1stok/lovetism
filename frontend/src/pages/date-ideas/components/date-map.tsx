import { useEffect, useState, useMemo } from 'react'
import { GoogleMap, Marker, DirectionsRenderer, Polyline, InfoWindow } from '@react-google-maps/api'
import { Maximize2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { DateStop } from '@/core/api/date-service'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

const MAP_HEIGHT_COMPACT = 300
const MAP_HEIGHT_MODAL = 'min(85vh, 600px)'

const LOVETISM_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#F0ECE4' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6B6560' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F0ECE4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#DDD8CE' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#F0ECE4' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E8E4DC' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E8F0E8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D8E4F0' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#DDD8CE' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F5F2EB' }] },
]

type TravelMode = 'WALKING' | 'TRANSIT' | 'DRIVING'

interface DateMapProps {
  stops: DateStop[]
  travelMode?: TravelMode
  className?: string
  /** When true, shows expand button and supports modal. Default true for inline embeds. */
  showExpandButton?: boolean
}

const OSRM_PROFILE: Record<TravelMode, string> = {
  WALKING: 'foot',
  DRIVING: 'driving',
  TRANSIT: 'foot',
}

/** Fetches road-following route from OSRM when Google Directions fails. */
async function fetchOsrmRoute(
  points: { lat: number; lng: number }[],
  profile: string
): Promise<{ lat: number; lng: number }[] | null> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null
  return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildInfoContent(stop: DateStop & { lat: number; lng: number }, index: number): string {
  const photoRef = stop.photo_reference ?? stop.photo_references?.[0]
  const photoUrl = photoRef && GOOGLE_API_KEY
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
    : ''
  const name = escapeHtml(stop.name)
  return `
    <div style="
      font-family: 'DM Mono', monospace;
      background: #FAF8F5;
      color: #1A1814;
      padding: 0;
      min-width: 280px;
      max-width: 340px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #C97B7B;
      box-shadow: 0 8px 32px rgba(26,24,20,0.25), 0 2px 8px rgba(26,24,20,0.15);
    ">
      <div style="
        background: #C97B7B;
        color: #FAF8F5;
        font-size: 0.7rem;
        font-weight: bold;
        letter-spacing: 0.12em;
        padding: 10px 14px;
        text-transform: uppercase;
      ">Stop ${index + 1}</div>
      ${photoUrl ? `
        <img src="${photoUrl}" alt="${name}" style="
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        " />
      ` : ''}
      <div style="padding: 14px 16px;">
        <div style="font-weight: 600; font-size: 16px; color: #1A1814; margin-bottom: 8px; line-height: 1.3;">${name}</div>
        <div style="font-size: 13px; color: #1A1814; line-height: 1.5; opacity: 0.85;">${escapeHtml(stop.why)}</div>
        <div style="font-size: 12px; color: #6B6560; margin-top: 10px; font-weight: 500;">${escapeHtml(stop.arrival_time)} · ~$${stop.estimated_spend}</div>
      </div>
    </div>
  `
}

export function DateMap({ stops, travelMode = 'WALKING', className = '', showExpandButton = true }: DateMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [directionsFailed, setDirectionsFailed] = useState(false)
  const [osrmPath, setOsrmPath] = useState<{ lat: number; lng: number }[] | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const stopsWithCoords = useMemo(
    () => stops.filter((s): s is DateStop & { lat: number; lng: number } => typeof s.lat === 'number' && typeof s.lng === 'number'),
    [stops]
  )

  const center = useMemo(() => {
    if (stopsWithCoords.length === 0) return { lat: 43.6596, lng: -79.3978 }
    const lat = stopsWithCoords.reduce((a, s) => a + s.lat, 0) / stopsWithCoords.length
    const lng = stopsWithCoords.reduce((a, s) => a + s.lng, 0) / stopsWithCoords.length
    return { lat, lng }
  }, [stopsWithCoords])

  const mapOptions = useMemo(
    () => ({
      styles: LOVETISM_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      fullscreenControl: true,
      fullscreenControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      gestureHandling: 'greedy' as const,
    }),
    []
  )

  useEffect(() => {
    if (stopsWithCoords.length < 2 || typeof google === 'undefined') return

    setDirections(null)
    setDirectionsFailed(false)
    setOsrmPath(null)
    let cancelled = false

    const service = new google.maps.DirectionsService()
    const origin = stopsWithCoords[0]
    const destination = stopsWithCoords[stopsWithCoords.length - 1]
    const waypoints =
      stopsWithCoords.length > 2
        ? stopsWithCoords.slice(1, -1).map((s) => ({ location: new google.maps.LatLng(s.lat, s.lng), stopover: true }))
        : []

    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: google.maps.TravelMode[travelMode],
      },
      async (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          if (!cancelled) {
            setDirections(result)
            setDirectionsFailed(false)
          }
        } else {
          const path = stopsWithCoords.map((s) => ({ lat: s.lat, lng: s.lng }))
          const osrm = await fetchOsrmRoute(path, OSRM_PROFILE[travelMode])
          if (!cancelled) {
            setDirections(null)
            setDirectionsFailed(true)
            setOsrmPath(osrm)
          }
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [stopsWithCoords, travelMode])

  const mapContainerStyle = { width: '100%', height: MAP_HEIGHT_COMPACT, borderRadius: '12px' }
  const mapContainerStyleModal = { width: '100%', height: MAP_HEIGHT_MODAL, borderRadius: '12px' }

  if (stopsWithCoords.length === 0) {
    return (
      <div
        className={`bg-surface border border-ink/10 rounded-xl flex items-center justify-center ${className}`}
        style={{ height: MAP_HEIGHT_COMPACT }}
      >
        <span className="font-mono text-xs text-ink-muted">Loading map...</span>
      </div>
    )
  }

  const MapContent = ({ isModal = false }: { isModal?: boolean }) => (
    <GoogleMap
        mapContainerStyle={isModal ? mapContainerStyleModal : mapContainerStyle}
        center={center}
        zoom={14}
        options={mapOptions}
        onLoad={(map) => {
          if (stopsWithCoords.length > 0) {
            const bounds = new google.maps.LatLngBounds()
            stopsWithCoords.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }))
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
          }
        }}
      >
        {stopsWithCoords.map((stop, index) => (
          <Marker
            key={`stop-${index}-${stop.google_place_id ?? stop.place_id}`}
            position={{ lat: stop.lat, lng: stop.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#C97B7B',
              fillOpacity: 1,
              strokeColor: '#FAF8F5',
              strokeWeight: 2,
            }}
            label={{
              text: String(index + 1),
              color: '#FAF8F5',
              fontWeight: 'bold',
              fontSize: '11px',
            }}
            title={stop.name}
            onClick={() => setSelectedIndex((prev) => (prev === index ? null : index))}
          />
        ))}
        {selectedIndex !== null && stopsWithCoords[selectedIndex] && (
          <InfoWindow
            position={{
              lat: stopsWithCoords[selectedIndex].lat,
              lng: stopsWithCoords[selectedIndex].lng,
            }}
            onCloseClick={() => setSelectedIndex(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -10),
            }}
          >
            <div
              style={{ margin: 0, padding: 0 }}
              dangerouslySetInnerHTML={{
                __html: buildInfoContent(stopsWithCoords[selectedIndex], selectedIndex),
              }}
            />
          </InfoWindow>
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#C97B7B',
                strokeOpacity: 0.9,
                strokeWeight: 4,
              },
            }}
          />
        )}
        {!directions && directionsFailed && stopsWithCoords.length >= 2 && (
          <Polyline
            path={
              osrmPath ??
              stopsWithCoords.map((s) => ({ lat: s.lat, lng: s.lng }))
            }
            options={{
              geodesic: !osrmPath,
              strokeColor: '#C97B7B',
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>
  )

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-ink/10 ${className}`}>
        {showExpandButton && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="absolute top-2 right-2 z-10 h-8 px-2.5 bg-cream/95 hover:bg-cream border border-ink/10 shadow-sm font-mono text-[0.65rem] uppercase tracking-wider"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
            Expand map
          </Button>
        )}
        <MapContent />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] w-full p-0 gap-0 overflow-hidden border-ink/10 rounded-xl [&>button]:right-3 [&>button]:top-3">
          <DialogTitle className="sr-only">Map</DialogTitle>
          <div className="w-full" style={{ height: MAP_HEIGHT_MODAL, minHeight: 400 }}>
            {modalOpen && <MapContent isModal />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
