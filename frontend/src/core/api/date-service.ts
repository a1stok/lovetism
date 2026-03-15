import { apiClient } from './client'

export interface DateStop {
  place_id: string
  google_place_id?: string
  name: string
  arrival_time: string
  duration_minutes: number
  why: string
  estimated_spend: number
}

export interface DateItinerary {
  title: string
  description: string
  stops: DateStop[]
  total_estimated_spend: number
  personal_touch?: string
  location_name?: string
  weather_summary?: string
  weather_advice?: string[]
}

export interface SavedDate extends DateItinerary {
  id: string
  google_maps_url?: string
  created_at: string
}

export interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  icon: string
  weathercode: number
  windSpeed: number
}

export interface GenerateDateParams {
  partnerId?: string | null
  vibes?: string[]
  transport?: string
  indoorOutdoor?: string
  budget?: number
  lat?: number
  lng?: number
  locationName?: string
  weather?: WeatherData | null
}

export const DateService = {
  async matchVibes(text: string): Promise<{ vibes: string[] }> {
    return apiClient.post('/api/dates/match-vibes', { text })
  },

  async generate(params: GenerateDateParams): Promise<DateItinerary> {
    return apiClient.post('/api/dates/generate', params)
  },

  async fetchWeather(lat: number, lng: number): Promise<WeatherData> {
    return apiClient.get(`/api/weather?lat=${lat}&lng=${lng}`)
  },

  async listSavedDates(): Promise<{ dates: SavedDate[] }> {
    return apiClient.get('/api/saved-dates')
  },

  async saveDate(itinerary: DateItinerary & { google_maps_url?: string }): Promise<SavedDate> {
    return apiClient.post('/api/saved-dates', itinerary)
  },

  async deleteSavedDate(id: string): Promise<void> {
    return apiClient.delete(`/api/saved-dates/${id}`)
  },
}
