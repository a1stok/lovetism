import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { placeDetails } from './services/google-places.service'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
import { sleep } from './utils/sleep.util'

async function run() {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  if (!googleKey) throw new Error('Missing GOOGLE_PLACES_API_KEY')

  console.log('Fetching places without photo_references in batches...')
  let updated = 0
  let failed = 0
  
  while (true) {
    const { data: places, error } = await supabaseAdmin
      .from('curated_places')
      .select('id, google_place_id, name')
      .filter('photo_references', 'is', 'null')
      .limit(1000)

    if (error) throw error
    if (!places || places.length === 0) {
      console.log('No more places need photo backfilling.')
      break
    }

    console.log(`Processing batch of ${places.length} places...`)

  for (const place of places) {
    try {
      const details = await placeDetails(googleKey, place.google_place_id)
      
      if (details.photoReferences && details.photoReferences.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('curated_places')
          .update({ photo_references: details.photoReferences })
          .eq('id', place.id)

        if (updateError) {
          console.error(`Failed to update ${place.name}:`, updateError)
          failed++
        } else {
          console.log(`[${updated + 1}/${places.length}] Updated ${place.name} (${details.photoReferences.length} photos)`)
          updated++
        }
      } else {
        console.log(`[${updated + failed + 1}/${places.length}] No photos found for ${place.name}`)
        // Set empty array so we don't query it again
        await supabaseAdmin.from('curated_places').update({ photo_references: [] }).eq('id', place.id)
        failed++
      }

      await sleep(100) // Rate limiting
    } catch (err) {
      console.error(`Error processing ${place.name}:`, err)
      failed++
    }
  }
  
  console.log(`Batch finished. Running tally - Updated: ${updated}, Failed/No Photos: ${failed}\n`)
  }

  console.log(`\nAll backfills complete! Total Updated: ${updated}, Total Failed/No Photos: ${failed}`)
}

run().catch(console.error)
