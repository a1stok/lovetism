import type { DateStop } from './date-service'

type TravelMode = 'walking' | 'transit' | 'driving'

/**
 * Generate a Google Maps multi-stop route URL.
 * Uses google_place_id when available, falls back to name-based search.
 */
export function generateGoogleMapsRouteUrl(
  stops: Pick<DateStop, 'google_place_id' | 'name'>[],
  travelMode: TravelMode = 'walking'
): string {
  if (stops.length === 0) return ''
  if (stops.length === 1) {
    const stop = stops[0]
    const query = stop.google_place_id
      ? `place_id:${stop.google_place_id}`
      : encodeURIComponent(stop.name)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const base = 'https://www.google.com/maps/dir/?api=1'

  const placeRef = (s: Pick<DateStop, 'google_place_id' | 'name'>) =>
    s.google_place_id ? `place_id:${s.google_place_id}` : encodeURIComponent(s.name)

  const origin = `&origin=${placeRef(stops[0])}`
  const destination = `&destination=${placeRef(stops[stops.length - 1])}`

  const middle = stops.slice(1, -1)
  const waypointParam = middle.length
    ? `&waypoints=${middle.map(placeRef).join('|')}`
    : ''

  return `${base}${origin}${destination}${waypointParam}&travelmode=${travelMode}`
}
