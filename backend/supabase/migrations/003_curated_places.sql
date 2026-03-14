-- Curated places table for date itinerary generation
-- Uses PostGIS for location-based queries within radius
-- Places API (New) Enterprise + Atmosphere fields included

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS curated_places (
  -- Identifiers
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id             TEXT UNIQUE NOT NULL,

  -- Basic info
  name                        TEXT NOT NULL,
  address                     TEXT,
  neighbourhood               TEXT,
  city                        TEXT DEFAULT 'Toronto',
  website                     TEXT,
  phone                       TEXT,
  google_maps_url             TEXT,
  business_status             TEXT,

  -- Location (lat/lng + PostGIS point, auto-generated)
  lat                         DECIMAL(10, 8) NOT NULL,
  lng                         DECIMAL(11, 8) NOT NULL,
  location                    GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,

  -- Google metrics
  google_rating               DECIMAL(2,1),
  google_review_count         INT,
  price_level                 INT CHECK (price_level BETWEEN 1 AND 4),
  budget_category             TEXT,
  avg_spend_min               INT,
  avg_spend_max               INT,

  -- Types
  primary_type                TEXT,
  google_types                TEXT[],
  sub_type                    TEXT,
  search_source               TEXT,
  keyword_used                TEXT,

  -- Opening hours
  opening_hours               JSONB,
  is_open_24h                 BOOLEAN DEFAULT false,
  serves_breakfast            BOOLEAN DEFAULT false,
  serves_brunch               BOOLEAN DEFAULT false,
  serves_lunch                BOOLEAN DEFAULT false,
  serves_dinner               BOOLEAN DEFAULT false,
  good_for_late_night         BOOLEAN DEFAULT false,

  -- Service options
  has_outdoor_seating         BOOLEAN DEFAULT false,
  reservable                  BOOLEAN DEFAULT false,
  takeout                     BOOLEAN DEFAULT false,
  delivery                    BOOLEAN DEFAULT false,
  dine_in                     BOOLEAN DEFAULT false,
  curbside_pickup             BOOLEAN DEFAULT false,
  drive_through               BOOLEAN DEFAULT false,
  allows_dogs                 BOOLEAN DEFAULT false,

  -- Food & drink
  serves_wine                 BOOLEAN DEFAULT false,
  serves_beer                 BOOLEAN DEFAULT false,
  serves_cocktails            BOOLEAN DEFAULT false,
  serves_coffee               BOOLEAN DEFAULT false,
  serves_dessert              BOOLEAN DEFAULT false,
  serves_vegetarian           BOOLEAN DEFAULT false,
  serves_happy_hour           BOOLEAN DEFAULT false,

  -- Atmosphere
  good_for_groups             BOOLEAN DEFAULT false,
  good_for_watching_sports     BOOLEAN DEFAULT false,
  good_for_children           BOOLEAN DEFAULT false,
  menu_for_children           BOOLEAN DEFAULT false,
  live_music                  BOOLEAN DEFAULT false,

  -- Accessibility
  wheelchair_entrance         BOOLEAN DEFAULT false,
  wheelchair_parking          BOOLEAN DEFAULT false,
  wheelchair_restroom         BOOLEAN DEFAULT false,
  wheelchair_seating          BOOLEAN DEFAULT false,

  -- Parking
  free_parking_lot            BOOLEAN DEFAULT false,
  free_street_parking         BOOLEAN DEFAULT false,
  paid_parking_lot            BOOLEAN DEFAULT false,
  valet_parking               BOOLEAN DEFAULT false,

  -- Payment
  accepts_cash_only           BOOLEAN DEFAULT false,
  accepts_credit_cards         BOOLEAN DEFAULT false,
  accepts_debit_cards          BOOLEAN DEFAULT false,
  accepts_nfc                 BOOLEAN DEFAULT false,

  -- Photos
  photo_reference             TEXT,
  photo_references            TEXT[],

  -- Scoring
  bayesian_score              DECIMAL(4,2),
  priority_score              DECIMAL(4,1),
  is_hidden_gem               BOOLEAN DEFAULT false,
  is_chain                    BOOLEAN DEFAULT false,
  is_verified                 BOOLEAN DEFAULT false,

  -- AI generated (Gemini)
  one_liner                   TEXT,
  date_description            TEXT,
  vibe_labels                 TEXT[],
  best_for                    TEXT[],
  highlights                  TEXT[],
  insider_tip                 TEXT,
  ai_vibe_summary             TEXT,
  google_editorial            TEXT,
  raw_reviews                 JSONB,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed              TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS places_location_idx ON curated_places USING GIST(location);
CREATE INDEX IF NOT EXISTS places_priority_idx ON curated_places(priority_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS places_type_idx ON curated_places(primary_type);
CREATE INDEX IF NOT EXISTS places_vibe_idx ON curated_places USING GIN(vibe_labels);
CREATE INDEX IF NOT EXISTS places_best_for_idx ON curated_places USING GIN(best_for);
CREATE INDEX IF NOT EXISTS places_budget_idx ON curated_places(price_level);
CREATE INDEX IF NOT EXISTS places_rating_idx ON curated_places(google_rating DESC);
