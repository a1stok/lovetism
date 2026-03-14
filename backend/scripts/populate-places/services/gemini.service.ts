/**
 * Gemini API service for vibe extraction.
 * Single responsibility: generate date-specific place descriptions from reviews.
 * Free tier: 15 RPM — use sleep(5000) between calls.
 */
import { normalizePriceLevel } from '../domain/scoring.domain';

export interface VibeResult {
  one_liner: string;
  date_description: string;
  vibe_labels: string[];
  best_for: string[];
  highlights: string[];
  insider_tip: string | null;
}

export async function extractVibe(
  apiKey: string,
  place: {
    name: string;
    types: string[];
    rating: number | null;
    userRatingCount: number | null;
    priceLevel: number | string | null;
  },
  details: {
    editorialSummary: string | null;
    outdoorSeating: boolean;
    reservable: boolean;
    servesCocktails: boolean;
    liveMusic: boolean;
    reviews: Array<{ text: string }>;
  }
): Promise<VibeResult | null> {
  const reviews = details.reviews.map((r) => `"${r.text}"`).join('\n') || 'No reviews available';
  const editorial = details.editorialSummary || '';

  const prompt = `You are curating places for a romantic date app in Toronto.

Place: "${place.name}"
Type: ${place.types.join(', ')}
Rating: ${place.rating ?? 'N/A'}/5 (${place.userRatingCount ?? 0} reviews)
Price: ${'$'.repeat(normalizePriceLevel(place.priceLevel))}
Google description: ${editorial}
Live music: ${details.liveMusic}
Outdoor seating: ${details.outdoorSeating}
Reservable: ${details.reservable}
Serves cocktails: ${details.servesCocktails}

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

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function callGemini(retriesLeft = 2): Promise<VibeResult | null> {
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

    if (res.status === 429 && retriesLeft > 0) {
      const body = (await res.json()) as {
        error?: { details?: Array<{ retryDelay?: string }> };
      };
      const retryDetail = body.error?.details?.find((d) => d.retryDelay);
      const retrySec = retryDetail
        ? parseFloat(retryDetail.retryDelay?.replace('s', '') ?? '60') || 60
        : 60;
      const waitMs = Math.ceil(retrySec * 1000);
      console.warn(`Gemini 429 for ${place.name}, waiting ${Math.ceil(retrySec)}s before retry...`);
      await sleep(waitMs);
      return callGemini(retriesLeft - 1);
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as VibeResult;
  }

  try {
    return await callGemini();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Gemini failed for ${place.name}:`, msg);
    return null;
  }
}
