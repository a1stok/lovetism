/**
 * Populate curated_places from Google Places API + Gemini.
 * Run: npm run populate-places
 */
import 'dotenv/config';
import { TORONTO_GRID, COMPACT_GRID } from './config/grid';
import { OFFICIAL_TYPES, KEYWORD_SEARCHES } from './config/types';
import { evaluateQualityFilter, shouldRunGemini } from './domain/place-filter.domain';
import { toCuratedPlaceRow } from './domain/place-mapper.domain';
import { nearbySearch, textSearch, placeDetails, type PlaceFromSearch } from './services/google-places.service';
import { extractVibe } from './services/gemini.service';
import { placeExists, upsertPlace } from './services/supabase.service';
import { sleep } from './utils/sleep.util';

const BAHEN_LAT = 43.6596;
const BAHEN_LNG = -79.3978;
const GEMINI_DELAY_MS = 8000; // Free tier ~7 RPM; increase if 429s persist
const GOOGLE_DELAY_MS = 100;
const SEARCH_DELAY_MS = 200;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return value;
}

async function processPlace(
  place: PlaceFromSearch,
  source: string,
  keyword: string | null,
  neighbourhood: string,
  googleKey: string,
  geminiKey: string
): Promise<boolean> {
  const { shouldProcess, priority } = evaluateQualityFilter(place);
  if (!shouldProcess || !priority) return false;

  const exists = await placeExists(place.id);
  if (exists) return false;

  const details = await placeDetails(googleKey, place.id);
  await sleep(GOOGLE_DELAY_MS);

  let vibe: Awaited<ReturnType<typeof extractVibe>> = null;
  const skipGemini = process.env.SKIP_GEMINI === '1' || process.env.SKIP_GEMINI === 'true';
  if (!skipGemini && shouldRunGemini(priority.score)) {
    vibe = await extractVibe(geminiKey, place, details);
    await sleep(GEMINI_DELAY_MS);
  }

  const row = toCuratedPlaceRow(place, details, vibe, priority, neighbourhood, source, keyword);
  const { success, error } = await upsertPlace(row);

  if (!success) {
    console.error(`DB error for ${place.name}:`, error);
    return false;
  }

  return true;
}

async function run(): Promise<void> {
  const googleKey = requireEnv('GOOGLE_PLACES_API_KEY');
  const skipGemini = process.env.SKIP_GEMINI === '1' || process.env.SKIP_GEMINI === 'true';
  const geminiKey = skipGemini ? '' : requireEnv('GEMINI_API_KEY');
  const compact = process.env.COMPACT === '1' || process.env.COMPACT === 'true';
  const grid = compact ? COMPACT_GRID : TORONTO_GRID;

  let stored = 0;
  let skipped = 0;
  let errors = 0;

  console.log('Starting Toronto population (Places API New)...');
  if (skipGemini) console.log('  [SKIP_GEMINI=1] No AI vibe — fast mode');
  if (compact) console.log('  [COMPACT=1] 6-point grid');
  console.log(`${grid.length} grid × ${OFFICIAL_TYPES.length} types + ${KEYWORD_SEARCHES.length} keywords\n`);

  // Phase 1: Nearby search by type
  console.log('Phase 1: Official types...');
  for (const point of grid) {
    for (const type of OFFICIAL_TYPES) {
      try {
        const places = await nearbySearch(googleKey, point.lat, point.lng, type);
        for (const place of places) {
          const ok = await processPlace(place, 'nearby_search', null, point.area, googleKey, geminiKey ?? '');
          ok ? stored++ : skipped++;
          await sleep(GOOGLE_DELAY_MS);
        }
        await sleep(SEARCH_DELAY_MS);
      } catch (err) {
        console.error(`Error ${type} at ${point.area}:`, err instanceof Error ? err.message : err);
        errors++;
      }
    }
  }

  // Phase 2: Keyword search
  console.log('\nPhase 2: Keyword searches...');
  for (const keyword of KEYWORD_SEARCHES) {
    try {
      const places = await textSearch(googleKey, keyword, BAHEN_LAT, BAHEN_LNG);
      for (const place of places) {
        const ok = await processPlace(place, 'keyword_search', keyword, 'Toronto', googleKey, geminiKey ?? '');
        ok ? stored++ : skipped++;
        await sleep(GOOGLE_DELAY_MS);
      }
      await sleep(300);
    } catch (err) {
      console.error(`Error "${keyword}":`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  console.log('\nDone!');
  console.log(`Stored:  ${stored}`);
  console.log(`Skipped: ${skipped} (chains/low quality/duplicates)`);
  console.log(`Errors:  ${errors}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
