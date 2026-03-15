import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../config/env.js'

const router = Router()
router.use(requireAuth)

const TORONTO_LAT = 43.6596
const TORONTO_LNG = -79.3978

function extractTextFromTiptap(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const obj = content as { content?: Array<{ type?: string; content?: unknown; text?: string }> }
  const parts: string[] = []
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; content?: unknown[]; text?: string }
    if (n.text) parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  if (Array.isArray(obj.content)) obj.content.forEach(walk)
  return parts.join(' ').trim()
}

async function fetchJournalsForDate(userId: string, partnerId: string | null): Promise<string> {
  const { data: myJournals } = await supabaseAdmin
    .from('journals')
    .select('id, user_id, name, visibility')
    .eq('user_id', userId)

  const journals = [...(myJournals ?? [])]

  if (partnerId) {
    const { data: partnerJournals } = await supabaseAdmin
      .from('journals')
      .select('id, user_id, name, visibility')
      .eq('user_id', partnerId)
      .eq('visibility', 'partner')
    journals.push(...(partnerJournals ?? []))
  }

  if (!journals?.length) return 'No journal entries.'

  const journalIds = journals.map((j) => j.id)
  const { data: nodes } = await supabaseAdmin
    .from('nodes')
    .select('journal_id, content, type')
    .in('journal_id', journalIds)
    .eq('type', 'file')

  const byJournal = new Map<string, typeof nodes>()
  for (const n of nodes ?? []) {
    const list = byJournal.get(n.journal_id) ?? []
    list.push(n)
    byJournal.set(n.journal_id, list)
  }

  const sections: string[] = []
  for (const j of journals) {
    const ownerLabel = j.user_id === userId ? 'Person 1' : 'Person 2'
    const nodesList = byJournal.get(j.id) ?? []
    const texts = nodesList.map((n) => extractTextFromTiptap(n.content)).filter(Boolean)
    if (texts.length) {
      sections.push(`${ownerLabel} (${j.name}, ${j.visibility}): ${texts.join(' | ')}`)
    }
  }
  return sections.length ? sections.join('\n') : 'No journal content.'
}

async function fetchPlaces(params: {
  lat: number
  lng: number
  vibes: string[]
  budgetMax: number
  indoorOutdoor: string
  limit?: number
}) {
  const { lat, lng, vibes, budgetMax, indoorOutdoor, limit = 50 } = params
  const maxPrice = Math.min(4, Math.max(1, Math.ceil(budgetMax / 50)))
  let q = supabaseAdmin
    .from('curated_places')
    .select('id, name, one_liner, date_description, vibe_labels, best_for, highlights, primary_type, google_rating, price_level, has_outdoor_seating')
    .not('one_liner', 'is', null)
    .lte('price_level', maxPrice)
    .order('priority_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (indoorOutdoor === 'indoor') {
    q = q.eq('has_outdoor_seating', false)
  } else if (indoorOutdoor === 'outdoor') {
    q = q.eq('has_outdoor_seating', true)
  }

  const { data, error } = await q
  if (error) throw error

  const filtered = (data ?? []).filter((p) => {
    if (vibes.length === 0) return true
    const labels = [...(p.vibe_labels ?? []), ...(p.best_for ?? [])]
    return vibes.some((v) => labels.some((l) => String(l).toLowerCase().includes(v.toLowerCase())))
  })

  return filtered.slice(0, 30)
}

const VIBE_LABELS = [
  'cozy', 'intimate', 'lively', 'loud', 'quiet', 'romantic', 'trendy', 'rustic', 'modern', 'dark', 'bright',
  'hidden_gem', 'touristy', 'local_favourite', 'upscale', 'casual', 'artsy', 'quirky', 'historic',
  'waterfront', 'rooftop', 'industrial', 'vintage',
]
const BEST_FOR = [
  'first_date', 'anniversary', 'casual_date', 'special_occasion', 'late_night', 'afternoon',
  'drinks_only', 'quick_coffee', 'active_date', 'cultural_date', 'foodie_date',
]
const ALL_VIBE_IDS = [...VIBE_LABELS, ...BEST_FOR] as const

/** Match free-text description to vibe IDs using AI */
router.post('/match-vibes', async (req, res) => {
  if (!env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'AI not configured' })
  }
  const { text } = req.body as { text?: string }
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Text required' })
  }

  const prompt = `You analyze date vibe descriptions and map them to these exact vibe IDs (use underscores, lowercase): ${ALL_VIBE_IDS.join(', ')}.

User wrote: "${text.trim()}"

Return ONLY a JSON array of matching vibe IDs (subset of the list above). Use exact IDs. Example: ["cozy","romantic","foodie_date"]
If nothing matches, return [].`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    return res.status(502).json({ message: `AI error: ${err}` })
  }

  const json = (await geminiRes.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    const arr = JSON.parse(cleaned) as unknown
    const vibes = Array.isArray(arr)
      ? arr
          .filter((v): v is string => typeof v === 'string')
          .map((v) => v.toLowerCase().trim())
          .filter((v) => ALL_VIBE_IDS.includes(v as (typeof ALL_VIBE_IDS)[number]))
      : []
    res.json({ vibes })
  } catch {
    res.status(502).json({ message: 'Invalid AI response' })
  }
})

/** Generate date itinerary */
router.post('/generate', async (req, res) => {
  if (!env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'Date generation not configured' })
  }

  const userId = req.userId!
  const {
    partnerId = null,
    vibes = [],
    transport = 'transit',
    indoorOutdoor = 'both',
    budget = 100,
    lat = TORONTO_LAT,
    lng = TORONTO_LNG,
  } = req.body as {
    partnerId?: string | null
    vibes?: string[]
    transport?: string
    indoorOutdoor?: string
    budget?: number
    lat?: number
    lng?: number
  }

  const [journalsText, places] = await Promise.all([
    fetchJournalsForDate(userId, partnerId ?? null),
    fetchPlaces({
      lat: Number(lat) || TORONTO_LAT,
      lng: Number(lng) || TORONTO_LNG,
      vibes: Array.isArray(vibes) ? vibes : [],
      budgetMax: Number(budget) || 100,
      indoorOutdoor: String(indoorOutdoor) || 'both',
    }),
  ])

  const prompt = `You are a romantic date planner for Toronto.

Journal context (what each person has shared):
${journalsText}

Preferences:
- Vibes: ${(Array.isArray(vibes) ? vibes : []).join(', ') || 'any'}
- Transport: ${transport}
- Indoor/Outdoor: ${indoorOutdoor}
- Budget: $${budget} total for both people

Available places (pick exactly 3 from this list):
${JSON.stringify(places.slice(0, 25), null, 2)}

Rules:
- Pick exactly 3 places from the list above. Use only place ids and names from the list.
- Total estimated spend must be under $${budget}.
- First place: dinner or main activity. Second: transition. Third: dessert/drinks or wind-down.
- Consider travel between stops (${transport}).
- Personalize using journal context when possible.

Return ONLY valid JSON, no markdown:
{
  "title": "Short romantic title",
  "description": "2 sentence overview for the couple",
  "stops": [
    {
      "place_id": "uuid from list",
      "name": "place name",
      "arrival_time": "7:00 PM",
      "duration_minutes": 60,
      "why": "personalized reason",
      "estimated_spend": 25
    }
  ],
  "total_estimated_spend": 75,
  "personal_touch": "one sentence from their journals if relevant"
}`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    return res.status(502).json({ message: `Gemini error: ${err}` })
  }

  const json = (await geminiRes.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = text.replace(/```json|```/g, '').trim()

  try {
    const itinerary = JSON.parse(cleaned)
    res.json(itinerary)
  } catch {
    res.status(502).json({ message: 'Invalid response from AI' })
  }
})

export default router
