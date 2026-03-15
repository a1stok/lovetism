import { useEffect, useState, useMemo } from 'react'
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api'
import type { DateStop } from '@/core/api/date-service'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

const MAP_CONTAINER_STYLE = { width: '100%', height: '300px', borderRadius: '12px' }

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
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
    : ''
  const name = escapeHtml(stop.name)
  return `
    <div style="
      font-family: 'DM Mono', monospace;
      background: #FAF8F5;
      color: #1A1814;
      padding: 0;
      min-width: 200px;
      max-width: 260px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #DDD8CE;
    ">
      <div style="
        background: #C97B7B;
        color: #FAF8F5;
        font-size: 0.65rem;
        font-weight: bold;
        letter-spacing: 0.1em;
        padding: 6px 10px;
        text-transform: uppercase;
      ">Stop ${index + 1}</div>
      ${photoUrl ? `
        <img src="${photoUrl}" alt="${name}" style="
          width: 100%;
          height: 120px;
          object-fit: cover;
          display: block;
        " />
      ` : ''}
      <div style="padding: 10px 12px;">
        <div style="font-weight: 600; font-size: 14px; color: #1A1814; margin-bottom: 6px;">${name}</div>
        <div style="font-size: 12px; color: #6B6560; line-height: 1.4;">${escapeHtml(stop.why)}</div>
        <div style="font-size: 11px; color: #6B6560; margin-top: 6px;">${escapeHtml(stop.arrival_time)} · ~$${stop.estimated_spend}</div>
      </div>
    </div>
  `
}

export function DateMap({ stops, travelMode = 'WALKING', className = '' }: DateMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

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
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    }),
    []
  )

  useEffect(() => {
    if (stopsWithCoords.length < 2 || typeof google === 'undefined') return

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
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result)
        } else {
          setDirections(null)
        }
      }
    )
  }, [stopsWithCoords, travelMode])

  if (stopsWithCoords.length === 0) {
    return (
      <div
        className={`bg-surface border border-ink/10 rounded-xl flex items-center justify-center ${className}`}
        style={{ height: 300 }}
      >
        <span className="font-mono text-xs text-ink-muted">Loading map...</span>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-ink/10 ${className}`}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
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
      </GoogleMap>
    </div>
  )
}
