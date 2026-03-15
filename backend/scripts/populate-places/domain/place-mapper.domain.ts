/**
 * Place mapping domain logic.
 * Single responsibility: map API responses to database row format.
 */
import type { PlaceFromSearch, PlaceDetails } from '../services/google-places.service';
import type { VibeResult } from '../services/gemini.service';
import type { PriorityResult } from './scoring.domain';
import { getPrimaryType, getBudgetInfo, isLateNight, normalizePriceLevel } from './scoring.domain';

export interface CuratedPlaceRow {
  google_place_id: string;
  name: string;
  address: string | null;
  neighbourhood: string;
  city: string;
  website: string | null;
  phone: string | null;
  google_maps_url: string;
  business_status: string | null;
  lat: number;
  lng: number;
  google_rating: number | null;
  google_review_count: number | null;
  price_level: number;
  budget_category: string;
  avg_spend_min: number;
  avg_spend_max: number;
  primary_type: string;
  google_types: string[];
  search_source: string;
  keyword_used: string | null;
  opening_hours: unknown;
  good_for_late_night: boolean;
  serves_breakfast: boolean;
  serves_brunch: boolean;
  serves_lunch: boolean;
  serves_dinner: boolean;
  is_open_24h: boolean;
  has_outdoor_seating: boolean;
  reservable: boolean;
  serves_wine: boolean;
  serves_beer: boolean;
  serves_cocktails: boolean;
  serves_vegetarian: boolean;
  good_for_groups: boolean;
  good_for_watching_sports: boolean;
  live_music: boolean;
  takeout: boolean;
  delivery: boolean;
  dine_in: boolean;
  allows_dogs: boolean;
  curbside_pickup: boolean;
  drive_through: boolean;
  serves_happy_hour: boolean;
  good_for_children: boolean;
  menu_for_children: boolean;
  wheelchair_entrance: boolean;
  wheelchair_parking: boolean;
  wheelchair_restroom: boolean;
  wheelchair_seating: boolean;
  free_parking_lot: boolean;
  free_street_parking: boolean;
  paid_parking_lot: boolean;
  valet_parking: boolean;
  accepts_cash_only: boolean;
  accepts_credit_cards: boolean;
  accepts_debit_cards: boolean;
  accepts_nfc: boolean;
  photo_reference: string | null;
  photo_references: string[];
  bayesian_score: number;
  priority_score: number;
  is_hidden_gem: boolean;
  is_chain: boolean;
  google_editorial: string | null;
  raw_reviews: Array<{ text: string; rating?: number }> | null;
  one_liner: string | null;
  date_description: string | null;
  vibe_labels: string[];
  best_for: string[];
  highlights: string[];
  insider_tip: string | null;
  ai_vibe_summary: string | null;
}

export function toCuratedPlaceRow(
  place: PlaceFromSearch,
  details: PlaceDetails,
  vibe: VibeResult | null,
  priority: PriorityResult,
  neighbourhood: string,
  source: string,
  keyword: string | null
): CuratedPlaceRow {
  const priceLevel = normalizePriceLevel(details.priceLevel ?? place.priceLevel);
  const budget = getBudgetInfo(priceLevel);

  return {
    google_place_id: place.id,
    name: place.name,
    address: details.address ?? null,
    neighbourhood,
    city: 'Toronto',
    website: details.website ?? null,
    phone: details.phone ?? null,
    google_maps_url: details.googleMapsUri ?? `https://maps.google.com/?place_id=${place.id}`,
    business_status: details.businessStatus ?? null,
    lat: place.lat,
    lng: place.lng,
    google_rating: place.rating,
    google_review_count: place.userRatingCount,
    price_level: priceLevel,
    budget_category: budget.category,
    avg_spend_min: budget.min,
    avg_spend_max: budget.max,
    primary_type: getPrimaryType(details.types ?? place.types),
    google_types: details.types ?? place.types ?? [],
    search_source: source,
    keyword_used: source === 'keyword_search' ? keyword : null,
    opening_hours: details.openingHours ?? null,
    good_for_late_night: isLateNight(details.openingHours),
    serves_breakfast: details.servesBreakfast ?? false,
    serves_brunch: details.servesBrunch ?? false,
    serves_lunch: details.servesLunch ?? false,
    serves_dinner: details.servesDinner ?? false,
    is_open_24h: false,
    has_outdoor_seating: details.outdoorSeating ?? false,
    reservable: details.reservable ?? false,
    serves_wine: details.servesWine ?? false,
    serves_beer: details.servesBeer ?? false,
    serves_cocktails: details.servesCocktails ?? false,
    serves_vegetarian: details.servesVegetarian ?? false,
    good_for_groups: details.goodForGroups ?? false,
    good_for_watching_sports: details.goodForWatchingSports ?? false,
    live_music: details.liveMusic ?? false,
    takeout: details.takeout ?? false,
    delivery: details.delivery ?? false,
    dine_in: details.dineIn ?? false,
    allows_dogs: details.allowsDogs ?? false,
    curbside_pickup: details.curbsidePickup ?? false,
    drive_through: details.driveThrough ?? false,
    serves_happy_hour: details.servesHappyHour ?? false,
    good_for_children: details.goodForChildren ?? false,
    menu_for_children: details.menuForChildren ?? false,
    wheelchair_entrance: details.wheelchairEntrance ?? false,
    wheelchair_parking: details.wheelchairParking ?? false,
    wheelchair_restroom: details.wheelchairRestroom ?? false,
    wheelchair_seating: details.wheelchairSeating ?? false,
    free_parking_lot: details.freeParkingLot ?? false,
    free_street_parking: details.freeStreetParking ?? false,
    paid_parking_lot: details.paidParkingLot ?? false,
    valet_parking: details.valetParking ?? false,
    accepts_cash_only: details.acceptsCashOnly ?? false,
    accepts_credit_cards: details.acceptsCreditCards ?? false,
    accepts_debit_cards: details.acceptsDebitCards ?? false,
    accepts_nfc: details.acceptsNfc ?? false,
    photo_reference: details.photoReference ?? null,
    photo_references: details.photoReferences ?? [],
    bayesian_score: priority.bayesian,
    priority_score: priority.score,
    is_hidden_gem: priority.isHiddenGem,
    is_chain: false,
    google_editorial: details.editorialSummary ?? null,
    raw_reviews: details.reviews ?? null,
    one_liner: vibe?.one_liner ?? null,
    date_description: vibe?.date_description ?? null,
    vibe_labels: vibe?.vibe_labels ?? [],
    best_for: vibe?.best_for ?? [],
    highlights: vibe?.highlights ?? [],
    insider_tip: vibe?.insider_tip ?? null,
    ai_vibe_summary: vibe?.date_description ?? null,
  };
}
