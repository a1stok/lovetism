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
  
  // Single place - use Search URL
  if (stops.length === 1) {
    const stop = stops[0]
    const encodedName = encodeURIComponent(stop.name)
    if (stop.google_place_id) {
      return `https://www.google.com/maps/search/?api=1&query=${encodedName}&query_place_id=${stop.google_place_id}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodedName}`
  }

  // Multi-stop - use Directions URL
  const base = 'https://www.google.com/maps/dir/?api=1'
  
  const lastIndex = stops.length - 1
  const origin = stops[0]
  const destination = stops[lastIndex]
  const waypoints = stops.slice(1, lastIndex)

  let url = `${base}&origin=${encodeURIComponent(origin.name)}&destination=${encodeURIComponent(destination.name)}`
  
  if (origin.google_place_id) {
    url += `&origin_place_id=${origin.google_place_id}`
  }
  
  if (destination.google_place_id) {
    url += `&destination_place_id=${destination.google_place_id}`
  }

  if (waypoints.length > 0) {
    url += `&waypoints=${waypoints.map(w => encodeURIComponent(w.name)).join('|')}`
    
    // waypoint_place_ids must parallel the waypoints list exactly. We leave empty space for waypoints missing a place ID
    const waypointIds = waypoints.map(w => w.google_place_id || '').join('|')
    // only append if at least one waypoint has an ID
    if (waypoints.some(w => !!w.google_place_id)) {
      url += `&waypoint_place_ids=${waypointIds}`
    }
  }

  url += `&travelmode=${travelMode}`
  return url
}
