import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/** List sync requests for current user (incoming pending) */
router.get('/', async (req, res) => {
  const userId = req.userId!

  const { data: rows, error } = await supabaseAdmin
    .from('sync_requests')
    .select('id, from_user_id, to_user_id, saved_date_id, status, created_at')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  const requests = rows ?? []
  if (requests.length === 0) {
    return res.json({ requests: [] })
  }

  const fromUserIds = [...new Set(requests.map((r) => r.from_user_id))]
  const savedDateIds = [...new Set(requests.map((r) => r.saved_date_id))]

  const [profilesRes, datesRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, first_name, last_name, nickname, avatar_url').in('id', fromUserIds),
    supabaseAdmin.from('saved_dates').select('id, title, description, stops, partner_name, total_estimated_spend, location_name').in('id', savedDateIds),
  ])

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
  const dateMap = new Map((datesRes.data ?? []).map((d) => [d.id, d]))

  const withDetails = requests.map((r) => {
    const fromProfile = profileMap.get(r.from_user_id)
    const date = dateMap.get(r.saved_date_id)
    return {
      id: r.id,
      from_user_id: r.from_user_id,
      from_user_name:
        fromProfile
          ? [fromProfile.first_name, fromProfile.last_name].filter(Boolean).join(' ') ||
            (fromProfile as { nickname?: string }).nickname ||
            'Partner'
          : null,
      from_user_avatar_url: fromProfile?.avatar_url ?? null,
      saved_date_id: r.saved_date_id,
      saved_date: date ?? null,
      status: r.status,
      created_at: r.created_at,
    }
  })

  res.json({ requests: withDetails })
})

/** Create sync request (send to partner) */
router.post('/', async (req, res) => {
  const userId = req.userId!
  const { saved_date_id } = req.body as { saved_date_id?: string }

  if (!saved_date_id) {
    return res.status(400).json({ message: 'saved_date_id required' })
  }

  const { data: date, error: dateErr } = await supabaseAdmin
    .from('saved_dates')
    .select('id, user_id, partner_id, status')
    .eq('id', saved_date_id)
    .single()

  if (dateErr || !date || date.user_id !== userId) {
    return res.status(404).json({ message: 'Saved date not found' })
  }

  if (date.status !== 'completed') {
    return res.status(400).json({ message: 'Can only sync past dates' })
  }

  if (!date.partner_id) {
    return res.status(400).json({ message: 'Solo dates cannot be synced' })
  }

  const { data: partnership } = await supabaseAdmin
    .from('partnerships')
    .select('user_id_1, user_id_2, status')
    .eq('id', date.partner_id)
    .single()

  if (!partnership || partnership.status !== 'active') {
    return res.status(400).json({ message: 'Partnership not found or not active' })
  }

  const toUserId = partnership.user_id_1 === userId ? partnership.user_id_2 : partnership.user_id_1
  if (toUserId === userId) {
    return res.status(400).json({ message: 'Invalid partner' })
  }

  const { data: existing } = await supabaseAdmin
    .from('sync_requests')
    .select('id, status')
    .eq('from_user_id', userId)
    .eq('to_user_id', toUserId)
    .eq('saved_date_id', saved_date_id)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return res.status(400).json({ message: 'Sync request already sent' })
    }
    if (existing.status === 'accepted') {
      return res.status(400).json({ message: 'Date already synced with partner' })
    }
  }

  const { data: inserted, error } = await supabaseAdmin
    .from('sync_requests')
    .insert({
      from_user_id: userId,
      to_user_id: toUserId,
      saved_date_id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Sync request already sent' })
    return res.status(500).json({ message: error.message })
  }

  res.status(201).json(inserted)
})

/** Accept sync request */
router.post('/:id/accept', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  const { data: reqRow, error: fetchErr } = await supabaseAdmin
    .from('sync_requests')
    .select('id, from_user_id, to_user_id, saved_date_id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !reqRow || reqRow.to_user_id !== userId) {
    return res.status(404).json({ message: 'Sync request not found' })
  }

  if (reqRow.status !== 'pending') {
    return res.status(400).json({ message: 'Request already processed' })
  }

  const { data: sourceDate, error: sourceErr } = await supabaseAdmin
    .from('saved_dates')
    .select('*')
    .eq('id', reqRow.saved_date_id)
    .single()

  if (sourceErr || !sourceDate) {
    return res.status(404).json({ message: 'Original date not found' })
  }

  const { data: partnership } = await supabaseAdmin
    .from('partnerships')
    .select('id')
    .eq('id', sourceDate.partner_id)
    .eq('status', 'active')
    .single()

  if (!partnership) {
    return res.status(400).json({ message: 'Partnership no longer active' })
  }

  const { data: fromProfile } = await supabaseAdmin
    .from('profiles')
    .select('first_name, last_name, nickname')
    .eq('id', reqRow.from_user_id)
    .single()

  const partnerName =
    fromProfile
      ? [fromProfile.first_name, fromProfile.last_name].filter(Boolean).join(' ') ||
        (fromProfile as { nickname?: string }).nickname ||
        null
      : null

  const { data: newDate, error: insertErr } = await supabaseAdmin
    .from('saved_dates')
    .insert({
      user_id: userId,
      title: sourceDate.title,
      description: sourceDate.description,
      personal_touch: sourceDate.personal_touch,
      total_estimated_spend: sourceDate.total_estimated_spend,
      location_name: sourceDate.location_name,
      weather_summary: sourceDate.weather_summary,
      weather_advice: sourceDate.weather_advice,
      stops: sourceDate.stops,
      google_maps_url: sourceDate.google_maps_url,
      partner_name: partnerName,
      partner_id: partnership.id,
      status: 'completed',
      stop_feedback: null,
    })
    .select()
    .single()

  if (insertErr) return res.status(500).json({ message: insertErr.message })

  await supabaseAdmin
    .from('saved_dates')
    .update({ linked_saved_date_id: newDate.id })
    .eq('id', sourceDate.id)

  await supabaseAdmin
    .from('saved_dates')
    .update({ linked_saved_date_id: sourceDate.id })
    .eq('id', newDate.id)

  await supabaseAdmin
    .from('sync_requests')
    .update({ status: 'accepted' })
    .eq('id', id)

  res.json({ saved_date: newDate, linked_to: sourceDate.id })
})

/** Reject sync request */
router.post('/:id/reject', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  const { data: reqRow } = await supabaseAdmin
    .from('sync_requests')
    .select('id, to_user_id, status')
    .eq('id', id)
    .single()

  if (!reqRow || reqRow.to_user_id !== userId) {
    return res.status(404).json({ message: 'Sync request not found' })
  }

  if (reqRow.status !== 'pending') {
    return res.status(400).json({ message: 'Request already processed' })
  }

  await supabaseAdmin.from('sync_requests').update({ status: 'rejected' }).eq('id', id)
  res.json({ status: 'rejected' })
})

export default router
