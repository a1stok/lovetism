import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

/** List partnerships for current user (both sent and received) */
router.get('/', async (req, res) => {
  const userId = req.userId!
  const { data, error } = await supabaseAdmin
    .from('partnerships')
    .select('id, user_id_1, user_id_2, status, created_at')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  const rows = data ?? []
  const partnerIds = [...new Set(rows.map((p) => (p.user_id_1 === userId ? p.user_id_2 : p.user_id_1)))]

  const { data: profiles } = partnerIds.length
    ? await supabaseAdmin.from('profiles').select('id, first_name, last_name, nickname, avatar_url').in('id', partnerIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((pr) => [pr.id, pr]))

  const withPartner = rows.map((p) => {
    const pid = p.user_id_1 === userId ? p.user_id_2 : p.user_id_1
    const partner = profileMap.get(pid) ?? null
    return {
      id: p.id,
      partnerId: pid,
      partner: partner
        ? {
            ...partner,
            displayName:
              [partner.first_name, partner.last_name].filter(Boolean).join(' ') ||
              (partner as { nickname?: string }).nickname ||
              'Partner',
          }
        : null,
      status: p.status,
      isInviter: p.user_id_1 === userId,
      created_at: p.created_at,
    }
  })

  res.json({ partnerships: withPartner })
})

/** Invite partner by nickname */
router.post('/invite', async (req, res) => {
  const userId = req.userId!
  const { nickname } = req.body as { nickname?: string }

  if (!nickname || typeof nickname !== 'string') {
    return res.status(400).json({ message: 'Nickname required' })
  }

  const { data: partnerProfile, error: lookupErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('nickname', nickname.trim())
    .single()

  if (lookupErr || !partnerProfile || partnerProfile.id === userId) {
    return res.status(404).json({ message: 'User not found or cannot invite yourself' })
  }

  const partnerId = partnerProfile.id

  const { data: rows } = await supabaseAdmin
    .from('partnerships')
    .select('id, status, user_id_1, user_id_2')
    .or(`and(user_id_1.eq.${userId},user_id_2.eq.${partnerId}),and(user_id_1.eq.${partnerId},user_id_2.eq.${userId})`)

  const match = Array.isArray(rows) ? rows[0] : null

  if (match) {
    if (match.status === 'active') {
      return res.status(400).json({ message: 'Already partners' })
    }
    return res.status(400).json({ message: 'Invite already sent' })
  }

  const { data, error } = await supabaseAdmin
    .from('partnerships')
    .insert({ user_id_1: userId, user_id_2: partnerId, status: 'pending' })
    .select()
    .single()

  if (error) return res.status(500).json({ message: error.message })
  res.status(201).json(data)
})

/** Accept partnership invite */
router.post('/:id/accept', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  const { data: p, error: fetchErr } = await supabaseAdmin
    .from('partnerships')
    .select('id, user_id_2')
    .eq('id', id)
    .single()

  if (fetchErr || !p || p.user_id_2 !== userId) {
    return res.status(404).json({ message: 'Invite not found' })
  }

  const { data, error } = await supabaseAdmin
    .from('partnerships')
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ message: error.message })
  res.json(data)
})

/** Remove partnership */
router.delete('/:id', async (req, res) => {
  const userId = req.userId!
  const { id } = req.params

  const { data: p } = await supabaseAdmin
    .from('partnerships')
    .select('user_id_1, user_id_2')
    .eq('id', id)
    .single()

  if (!p || (p.user_id_1 !== userId && p.user_id_2 !== userId)) {
    return res.status(404).json({ message: 'Partnership not found' })
  }

  const { error } = await supabaseAdmin.from('partnerships').delete().eq('id', id)
  if (error) return res.status(500).json({ message: error.message })
  res.status(204).send()
})

export default router
