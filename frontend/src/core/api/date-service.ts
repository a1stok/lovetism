import { apiClient } from './client'

export interface DateStop {
  place_id: string
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
}

export const DateService = {
  async matchVibes(text: string): Promise<{ vibes: string[] }> {
    return apiClient.post('/api/dates/match-vibes', { text })
  },

  async generate(params: {
    partnerId?: string | null
    vibes?: string[]
    transport?: string
    indoorOutdoor?: string
    budget?: number
    lat?: number
    lng?: number
  }): Promise<DateItinerary> {
    return apiClient.post('/api/dates/generate', params)
  },
}
