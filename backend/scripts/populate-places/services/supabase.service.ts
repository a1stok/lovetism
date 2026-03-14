/**
 * Supabase service for curated_places.
 * Single responsibility: database operations for place storage.
 */
import { createClient } from '@supabase/supabase-js';
import type { CuratedPlaceRow } from '../domain/place-mapper.domain';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

const supabase = createClient(url, serviceKey);

export async function placeExists(googlePlaceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('curated_places')
    .select('id')
    .eq('google_place_id', googlePlaceId)
    .maybeSingle();

  return data != null;
}

export async function upsertPlace(row: CuratedPlaceRow): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('curated_places')
    .upsert(row, { onConflict: 'google_place_id' });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
