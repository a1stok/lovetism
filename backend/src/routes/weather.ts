import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/** WMO Weather interpretation codes → human-readable condition + icon */
const WMO_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear Sky', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Icy Fog', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Drizzle', icon: '🌦️' },
  55: { condition: 'Heavy Drizzle', icon: '🌧️' },
  56: { condition: 'Freezing Drizzle', icon: '🌧️' },
  57: { condition: 'Heavy Freezing Drizzle', icon: '🌧️' },
  61: { condition: 'Light Rain', icon: '🌦️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  66: { condition: 'Freezing Rain', icon: '🌧️' },
  67: { condition: 'Heavy Freezing Rain', icon: '🌧️' },
  71: { condition: 'Light Snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '❄️' },
  75: { condition: 'Heavy Snow', icon: '❄️' },
  77: { condition: 'Snow Grains', icon: '❄️' },
  80: { condition: 'Light Showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌧️' },
  82: { condition: 'Heavy Showers', icon: '🌧️' },
  85: { condition: 'Snow Showers', icon: '🌨️' },
  86: { condition: 'Heavy Snow Showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with Heavy Hail', icon: '⛈️' },
}

export interface WeatherData {
  temperature: number
  condition: string
  icon: string
  weathercode: number
  windSpeed: number
  feelsLike: number
}

/** GET /api/weather?lat=43.65&lng=-79.39 */
router.get('/', async (req, res) => {
  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng)

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ message: 'lat and lng query params required' })
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    const response = await fetch(url)

    if (!response.ok) {
      return res.status(502).json({ message: 'Weather service unavailable' })
    }

    const data = (await response.json()) as {
      current: {
        temperature_2m: number
        apparent_temperature: number
        weather_code: number
        wind_speed_10m: number
      }
    }

    const current = data.current
    const wmo = WMO_CODES[current.weather_code] ?? { condition: 'Unknown', icon: '🌡️' }

    const weather: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      condition: wmo.condition,
      icon: wmo.icon,
      weathercode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
    }

    res.json(weather)
  } catch {
    res.status(502).json({ message: 'Failed to fetch weather' })
  }
})

export default router
