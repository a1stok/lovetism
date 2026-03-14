/**
 * Backfill vibe fields for curated_places where one_liner IS NULL.
 * Updates existing rows only. Run: npm run backfill-vibes
 *
 * Env: AI_PROVIDER=gemini|openai (default: gemini), GEMINI_API_KEY, OPENAI_API_KEY, LIMIT
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const GEMINI_DELAY_MS = 6000;
const OPENAI_DELAY_MS = 1000;

interface VibeResult {
  one_liner: string;
  date_description: string;
  vibe_labels: string[];
  best_for: string[];
  highlights: string[];
  insider_tip: string | null;
}

interface PlaceRow {
  id: string;
  google_place_id: string;
  name: string;
  primary_type: string | null;
  google_types: string[] | null;
  google_rating: number | null;
  google_review_count: number | null;
  price_level: number;
  google_editorial: string | null;
  raw_reviews: Array<{ text?: string }> | null;
  has_outdoor_seating: boolean;
  reservable: boolean;
  serves_cocktails: boolean;
  live_music: boolean;
}

function buildPrompt(row: PlaceRow): string {
  const types = row.google_types ?? (row.primary_type ? [row.primary_type] : []);
  const reviews =
    row.raw_reviews?.map((r) => `"${r.text ?? ''}"`).join('\n') || 'No reviews available';
  const editorial = row.google_editorial || '';
  const priceStr = '$'.repeat(Math.min(4, Math.max(1, row.price_level ?? 2)));

  return `You are curating places for a romantic date app in Toronto.

Place: "${row.name}"
Type: ${types.join(', ')}
Rating: ${row.google_rating ?? 'N/A'}/5 (${row.google_review_count ?? 0} reviews)
Price: ${priceStr}
Google description: ${editorial}
Live music: ${row.live_music}
Outdoor seating: ${row.has_outdoor_seating}
Reservable: ${row.reservable}
Serves cocktails: ${row.serves_cocktails}

Customer reviews:
${reviews}

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "one_liner": "punchy 1 sentence eg 'Jazz bar with live Friday concerts and craft cocktails'",
  "date_description": "2-3 sentences for couples. Focus on atmosphere and what makes it special for a date. Max 60 words.",
  "vibe_labels": [],
  "best_for": [],
  "highlights": [],
  "insider_tip": null
}

For vibe_labels choose from: cozy, intimate, lively, loud, quiet, romantic, trendy, rustic, modern, dark, bright, hidden_gem, touristy, local_favourite, upscale, casual, artsy, quirky, historic, waterfront, rooftop, industrial, vintage

For best_for choose from: first_date, anniversary, casual_date, special_occasion, late_night, afternoon, drinks_only, quick_coffee, active_date, cultural_date, foodie_date

For highlights: max 3 specific things eg ["live jazz fridays", "window seats", "extensive whiskey menu"]

insider_tip: one specific actionable tip or null`;
}

async function callGemini(apiKey: string, prompt: string, placeName: string): Promise<VibeResult | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (res.status === 429) {
    const body = (await res.json()) as { error?: { details?: Array<{ retryDelay?: string }> } };
    const retryDetail = body.error?.details?.find((d) => d.retryDelay);
    const retrySec = retryDetail ? parseFloat(retryDetail.retryDelay?.replace('s', '') ?? '60') || 60 : 60;
    throw new Error(`RATE_LIMIT:${Math.ceil(retrySec * 1000)}`);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as VibeResult;
}

async function callOpenAI(apiKey: string, prompt: string): Promise<VibeResult | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (res.status === 429) throw new Error('RATE_LIMIT:60000');

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content ?? '';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as VibeResult;
}

async function extractVibe(
  provider: string,
  apiKey: string,
  row: PlaceRow
): Promise<VibeResult | null> {
  const prompt = buildPrompt(row);
  if (provider === 'openai') return callOpenAI(apiKey, prompt);
  return callGemini(apiKey, prompt, row.name);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const limit = parseInt(process.env.LIMIT || '0', 10) || 999999;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (provider === 'gemini' && !geminiKey) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }
  if (provider === 'openai' && !openaiKey) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }

  const apiKey = provider === 'openai' ? openaiKey! : geminiKey!;
  const supabase = createClient(url, serviceKey);

  const BATCH = 1000;
  const rows: PlaceRow[] = [];
  let offset = 0;
  let batch: PlaceRow[] | null;

  do {
    const { data, error: fetchError } = await supabase
      .from('curated_places')
      .select('id, google_place_id, name, primary_type, google_types, google_rating, google_review_count, price_level, google_editorial, raw_reviews, has_outdoor_seating, reservable, serves_cocktails, live_music')
      .is('one_liner', null)
      .range(offset, offset + BATCH - 1)
      .order('id')
      .returns<PlaceRow[]>();

    if (fetchError) {
      console.error('DB fetch error:', fetchError.message);
      process.exit(1);
    }
    batch = data ?? [];
    rows.push(...batch);
    offset += BATCH;
  } while (batch.length === BATCH && rows.length < limit);

  const toProcess = rows.slice(0, limit);
  const total = toProcess.length;
  if (total === 0) {
    console.log('No places need vibe backfill. All done!');
    return;
  }

  console.log(`Backfilling vibes (${provider}) for ${total} places...\n`);

  let updated = 0;
  let failed = 0;

  for (const row of toProcess) {
    let retriesLeft = 2;
    let done = false;

    while (!done && retriesLeft >= 0) {
      try {
        const vibe = await extractVibe(provider, apiKey, row);
        if (!vibe) {
          failed++;
          done = true;
          break;
        }

        const { error } = await supabase
          .from('curated_places')
          .update({
            one_liner: vibe.one_liner,
            date_description: vibe.date_description,
            vibe_labels: vibe.vibe_labels,
            best_for: vibe.best_for,
            highlights: vibe.highlights,
            insider_tip: vibe.insider_tip,
            ai_vibe_summary: vibe.date_description,
            last_refreshed: new Date().toISOString(),
          })
          .eq('id', row.id);

        if (error) {
          console.error(`DB update error for ${row.name}:`, error.message);
          failed++;
        } else {
          updated++;
          console.log(`  ✓ ${row.name}`);
        }
        done = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.startsWith('RATE_LIMIT:') && retriesLeft > 0) {
          const waitMs = parseInt(msg.split(':')[1], 10) || 60000;
          console.warn(`  Rate limit for ${row.name}, waiting ${Math.ceil(waitMs / 1000)}s then retry...`);
          await sleep(waitMs);
          retriesLeft--;
        } else {
          console.error(`  ✗ ${row.name}:`, msg);
          failed++;
          done = true;
        }
      }
    }

    const delay = provider === 'openai' ? OPENAI_DELAY_MS : GEMINI_DELAY_MS;
    await sleep(delay);
  }

  console.log('\nDone!');
  console.log(`Updated: ${updated}`);
  console.log(`Failed:  ${failed}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
