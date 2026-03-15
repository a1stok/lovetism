import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/** List saved dates for current user */
router.get('/', async (req, res) => {
  const userId = req.userId!

  const { data, error } = await supabaseAdmin
    .from('saved_dates')
    .select('id, title, description, personal_touch, total_estimated_spend, location_name, weather_summary, weather_advice, stops, google_maps_url, partner_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  res.json({ dates: data ?? [] })
})

/** Save a generated date itinerary */
router.post('/', async (req, res) => {
  const userId = req.userId!
  const {
    title,
    description,
    personal_touch,
    total_estimated_spend,
    location_name,
    weather_summary,
    weather_advice,
    stops,
    google_maps_url,
  } = req.body as {
    title: string
    description?: string
    personal_touch?: string
    total_estimated_spend?: number
    location_name?: string
    weather_summary?: string
    weather_advice?: string[]
    stops: unknown[]
    google_maps_url?: string
  }

  if (!title || !Array.isArray(stops)) {
    return res.status(400).json({ message: 'title and stops are required' })
  }

  const { data, error } = await supabaseAdmin
    .from('saved_dates')
    .insert({
      user_id: userId,
      title,
      description: description ?? null,
      personal_touch: personal_touch ?? null,
      total_estimated_spend: total_estimated_spend ?? null,
      location_name: location_name ?? null,
      weather_summary: weather_summary ?? null,
      weather_advice: weather_advice ?? null,
      stops,
      google_maps_url: google_maps_url ?? null,
      partner_name: partner_name ?? null,
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  res.status(201).json(data)
})

/** Delete a saved date */
router.delete('/:id', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('saved_dates')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== userId) {
    return res.status(404).json({ message: 'Saved date not found' })
  }

  const { error } = await supabaseAdmin
    .from('saved_dates')
    .delete()
    .eq('id', id)

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  res.status(204).send()
})

export default router
