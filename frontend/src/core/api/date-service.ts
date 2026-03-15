import { apiClient } from './client'

export interface DateStop {
  place_id: string
  google_place_id?: string
  lat?: number
  lng?: number
  photo_reference?: string | null
  photo_references?: string[] | null
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

export type StopFeedbackRating = 'satisfied' | 'good' | 'okay' | 'not_good' | 'bad'

export interface StopFeedback {
  stop_index: number
  rating: StopFeedbackRating
  feedback?: string | null
}

export interface LinkedDateFeedback {
  id: string
  user_id: string
  user_avatar_url?: string | null
  stop_feedback?: StopFeedback[] | null
}

export interface SavedDate extends DateItinerary {
  id: string
  google_maps_url?: string
  partner_name?: string | null
  partner_id?: string | null
  partner_avatar_url?: string | null
  status?: 'saved' | 'completed'
  stop_feedback?: StopFeedback[] | null
  linked_saved_date_id?: string | null
  linked_date?: LinkedDateFeedback | null
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

  async listSavedDates(status?: 'saved' | 'completed'): Promise<{ dates: SavedDate[] }> {
    const params = status ? { status } : {}
    return apiClient.get('/api/saved-dates', { params })
  },

  async saveDate(itinerary: DateItinerary & { google_maps_url?: string; partner_name?: string | null; partner_id?: string | null }): Promise<SavedDate> {
    return apiClient.post('/api/saved-dates', itinerary)
  },

  async markDateCompleted(id: string, feedback?: StopFeedback[]): Promise<SavedDate> {
    return apiClient.patch(`/api/saved-dates/${id}/complete`, feedback ? { feedback } : {})
  },

  async updateFeedback(id: string, feedback: StopFeedback[]): Promise<SavedDate> {
    return apiClient.patch(`/api/saved-dates/${id}/feedback`, { feedback })
  },

  async deleteSavedDate(id: string): Promise<void> {
    return apiClient.delete(`/api/saved-dates/${id}`)
  },
}

export interface SyncRequest {
  id: string
  from_user_id: string
  from_user_name: string | null
  from_user_avatar_url: string | null
  saved_date_id: string
  saved_date: { title: string; description?: string; stops?: unknown[]; partner_name?: string; total_estimated_spend?: number; location_name?: string } | null
  status: string
  created_at: string
}

export const SyncRequestService = {
  async list(): Promise<{ requests: SyncRequest[] }> {
    return apiClient.get('/api/sync-requests')
  },

  async create(savedDateId: string): Promise<{ id: string }> {
    return apiClient.post('/api/sync-requests', { saved_date_id: savedDateId })
  },

  async accept(id: string): Promise<{ saved_date: SavedDate; linked_to: string }> {
    return apiClient.post(`/api/sync-requests/${id}/accept`)
  },

  async reject(id: string): Promise<{ status: string }> {
    return apiClient.post(`/api/sync-requests/${id}/reject`)
  },
}
