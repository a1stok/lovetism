import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/** List saved dates for current user, with optional status filter */
router.get('/', async (req, res) => {
  const userId = req.userId!
  const { status: statusFilter } = req.query as { status?: string }

  let q = supabaseAdmin
    .from('saved_dates')
    .select('id, title, description, personal_touch, total_estimated_spend, location_name, weather_summary, weather_advice, stops, google_maps_url, partner_name, partner_id, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (statusFilter && ['saved', 'completed'].includes(statusFilter)) {
    q = q.eq('status', statusFilter)
  }

  const { data: rows, error } = await q

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  const dates = rows ?? []
  const partnerIds = [...new Set(dates.map((d) => d.partner_id).filter(Boolean))] as string[]

  const avatarMap = new Map<string, string>()
  if (partnerIds.length > 0) {
    const { data: partnerships } = await supabaseAdmin
      .from('partnerships')
      .select('id, user_id_1, user_id_2')
      .in('id', partnerIds)
    const otherUserIds = (partnerships ?? []).map((p) =>
      p.user_id_1 === userId ? p.user_id_2 : p.user_id_1
    )
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, avatar_url')
      .in('id', otherUserIds)
    const profileMap = new Map((profiles ?? []).map((pr) => [pr.id, pr.avatar_url ?? '']))
    for (const p of partnerships ?? []) {
      const otherId = p.user_id_1 === userId ? p.user_id_2 : p.user_id_1
      avatarMap.set(p.id, profileMap.get(otherId) ?? '')
    }
  }

  const withAvatar = dates.map((d) => ({
    ...d,
    partner_avatar_url: d.partner_id ? avatarMap.get(d.partner_id) ?? null : null,
  }))

  res.json({ dates: withAvatar })
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
    partner_name,
    partner_id,
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
    partner_name?: string
    partner_id?: string
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
      partner_id: partner_id ?? null,
      status: 'saved',
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  res.status(201).json(data)
})

/** Mark saved date as completed (went on date) */
router.patch('/:id/complete', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  const { data: existing } = await supabaseAdmin
    .from('saved_dates')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== userId) {
    return res.status(404).json({ message: 'Saved date not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('saved_dates')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ message: error.message })
  res.json(data)
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
