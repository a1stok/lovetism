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
    .select('id, google_place_id, lat, lng, photo_reference, photo_references, name, one_liner, date_description, vibe_labels, best_for, highlights, primary_type, google_rating, price_level, has_outdoor_seating')
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
  if (!env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'AI not configured (Missing GROQ_API_KEY)' })
  }
  const { text } = req.body as { text?: string }
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ message: 'Text required' })
  }

  const prompt = `You analyze date vibe descriptions and map them to these exact vibe IDs (use underscores, lowercase): ${ALL_VIBE_IDS.join(', ')}.

User wrote: "${text.trim()}"

Return ONLY a JSON array of matching vibe IDs (subset of the list above). Use exact IDs. Example: ["cozy","romantic","foodie_date"]
If nothing matches, return [].`

  const groqRes = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    }
  )

  if (!groqRes.ok) {
    const err = await groqRes.text()
    return res.status(502).json({ message: `Groq error: ${err}` })
  }

  const json = (await groqRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const raw = json.choices?.[0]?.message?.content ?? '[]'
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
  if (!env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'Date generation not configured (Missing GROQ_API_KEY)' })
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
    locationName = 'Toronto',
    weather = null,
  } = req.body as {
    partnerId?: string | null
    vibes?: string[]
    transport?: string
    indoorOutdoor?: string
    budget?: number
    lat?: number
    lng?: number
    locationName?: string
    weather?: { temperature: number; condition: string; icon: string; feelsLike: number; windSpeed: number } | null
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

  const weatherContext = weather
    ? `\nCurrent weather at ${locationName}: ${weather.temperature}°C (feels like ${weather.feelsLike}°C), ${weather.condition}, wind ${weather.windSpeed} km/h.\nConsider this when planning — suggest indoor spots if rainy/cold, patios/rooftops if sunny/warm, warm cafes if cold. Provide practical weather-based outfit and planning advice.`
    : ''

  const prompt = `You are a romantic date planner for ${locationName}.

Journal context (what each person has shared):
${journalsText}

Preferences:
- Vibes: ${(Array.isArray(vibes) ? vibes : []).join(', ') || 'any'}
- Transport: ${transport}
- Indoor/Outdoor: ${indoorOutdoor}
- Budget: $${budget} total for both people
${weatherContext}

Available places (pick exactly 3 from this list — each has a google_place_id you MUST include in your response):
${JSON.stringify(
  places.slice(0, 15).map(p => ({
    id: p.id,
    google_place_id: p.google_place_id,
    photo_reference: p.photo_reference,
    name: p.name,
    one_liner: p.one_liner,
    date_description: p.date_description,
    price_level: p.price_level
  })), 
  null, 2
)}

Rules:
- Pick exactly 3 places from the list above. Use only place ids, google_place_ids, photo_reference, and names from the list. Use one_liner and date_description to write rich descriptions.
- Total estimated spend must be under $${budget}.
- First place: dinner or main activity. Second: transition. Third: dessert/drinks or wind-down.
- Consider travel between stops (${transport}).
- Personalize using journal context when possible.
- Include practical weather-based advice as bullet points.

Return ONLY valid JSON, no markdown:
{
  "title": "Short romantic title",
  "description": "2 sentence overview for the couple",
  "stops": [
    {
      "place_id": "uuid from list",
      "google_place_id": "google_place_id from list",
      "photo_reference": "photo_reference from list (if available, else null)",
      "name": "place name",
      "arrival_time": "7:00 PM",
      "duration_minutes": 60,
      "why": "1-2 short lines max. One personalized reason why this place fits. For stops 2-3, optionally start with a brief transition (e.g. 'After dinner, walk to...'). Be concise, no filler.",
      "estimated_spend": 25
    }
  ],
  "total_estimated_spend": 75,
  "personal_touch": "one sentence from their journals if relevant",
  "weather_advice": ["practical tip about what to wear or prepare based on weather", "another tip"]
}`

  const groqRes = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    }
  )

  if (!groqRes.ok) {
    const err = await groqRes.text()
    return res.status(502).json({ message: `Groq error: ${err}` })
  }

  const json = (await groqRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const responseText = json.choices?.[0]?.message?.content ?? ''
  const cleaned = responseText.replace(/```json|```/g, '').trim()

  try {
    const itinerary = JSON.parse(cleaned)
    if (itinerary.stops && Array.isArray(itinerary.stops)) {
      itinerary.stops = itinerary.stops.map((stop: { place_id?: string; google_place_id?: string; photo_references?: string[]; lat?: number; lng?: number }) => {
        const place =
          places.find((p: { google_place_id: string }) => p.google_place_id === stop.google_place_id) ??
          places.find((p: { id: string }) => p.id === stop.place_id)
        if (place) {
          stop.photo_references = place.photo_references || []
          stop.lat = Number(place.lat)
          stop.lng = Number(place.lng)
        }
        return stop
      })
    }
    
    res.json(itinerary)
  } catch (err) {
    console.error('Failed to parse AI response:', cleaned)
    res.status(502).json({ message: `Invalid response from AI. Raw response: ${cleaned.substring(0, 200)}...` })
  }
})

export default router
