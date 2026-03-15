/**
 * Google Places API (New) service.
 * Single responsibility: fetch place data from Google.
 * @see https://developers.google.com/maps/documentation/places/web-service
 */

const BASE_URL = 'https://places.googleapis.com/v1';

const NEARBY_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.primaryType',
  'places.types',
  'places.photos',
  'places.editorialSummary',
  'places.outdoorSeating',
  'places.reservable',
  'places.servesBeer',
  'places.servesWine',
  'places.servesCocktails',
  'places.servesBreakfast',
  'places.servesBrunch',
  'places.servesLunch',
  'places.servesDinner',
  'places.liveMusic',
  'places.goodForGroups',
  'places.reviews',
].join(',');

const DETAILS_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'primaryType',
  'types',
  'photos',
  'editorialSummary',
  'regularOpeningHours',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'businessStatus',
  'outdoorSeating',
  'reservable',
  'servesBeer',
  'servesWine',
  'servesCocktails',
  'servesBreakfast',
  'servesBrunch',
  'servesLunch',
  'servesDinner',
  'servesVegetarianFood',
  'servesCoffee',
  'servesDessert',
  'liveMusic',
  'goodForGroups',
  'goodForWatchingSports',
  'goodForChildren',
  'menuForChildren',
  'takeout',
  'delivery',
  'dineIn',
  'curbsidePickup',
  'allowsDogs',
  'reviews',
  'googleMapsUri',
  'accessibilityOptions',
  'parkingOptions',
  'paymentOptions',
].join(',');

export interface PlaceFromSearch {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null;
  primaryType: string | null;
  types: string[];
  photoReference: string | null;
  photoReferences: string[];
  editorialSummary: string | null;
  outdoorSeating: boolean;
  reservable: boolean;
  servesBeer: boolean;
  servesWine: boolean;
  servesCocktails: boolean;
  servesBreakfast: boolean;
  servesBrunch: boolean;
  servesLunch: boolean;
  servesDinner: boolean;
  liveMusic: boolean;
  goodForGroups: boolean;
  reviews: Array<{ text: string; rating?: number }>;
}

export interface PlaceDetails extends PlaceFromSearch {
  website: string | null;
  phone: string | null;
  openingHours: unknown;
  googleMapsUri: string | null;
  businessStatus: string | null;
  servesVegetarian: boolean;
  servesHappyHour: boolean;
  goodForWatchingSports: boolean;
  goodForChildren: boolean;
  menuForChildren: boolean;
  takeout: boolean;
  delivery: boolean;
  dineIn: boolean;
  curbsidePickup: boolean;
  allowsDogs: boolean;
  driveThrough: boolean;
  wheelchairEntrance: boolean;
  wheelchairParking: boolean;
  wheelchairRestroom: boolean;
  wheelchairSeating: boolean;
  freeParkingLot: boolean;
  freeStreetParking: boolean;
  paidParkingLot: boolean;
  valetParking: boolean;
  acceptsCashOnly: boolean;
  acceptsCreditCards: boolean;
  acceptsDebitCards: boolean;
  acceptsNfc: boolean;
}

function parsePlaceFromResponse(p: Record<string, unknown>): PlaceFromSearch {
  const loc = p.location as { latitude?: number; longitude?: number } | undefined;
  const lat = loc?.latitude ?? 0;
  const lng = loc?.longitude ?? 0;

  const displayName = p.displayName as { text?: string } | undefined;
  const name = displayName?.text ?? (p.name as string) ?? 'Unknown';

  const photos = p.photos as Array<{ name?: string }> | undefined;
  const photoRefs = (photos ?? [])
    .map(photo => photo.name?.split('/').pop() ?? null)
    .filter((ref): ref is string => ref !== null)
    .slice(0, 5); // Keep top 5 photos
  const photoRef = photoRefs.length > 0 ? photoRefs[0] : null;

  const reviews = (p.reviews as Array<{ text?: string; rating?: number }> | undefined) ?? [];
  const reviewList = reviews.map((r) => ({ text: r.text ?? '', rating: r.rating }));

  return {
    id: (p.id as string) ?? '',
    name,
    address: (p.formattedAddress as string) ?? null,
    lat,
    lng,
    rating: (p.rating as number) ?? null,
    userRatingCount: (p.userRatingCount as number) ?? null,
    priceLevel: (p.priceLevel as number) ?? null,
    primaryType: (p.primaryType as string) ?? null,
    types: ((p.types as string[]) ?? []) as string[],
    photoReference: photoRef,
    photoReferences: photoRefs,
    editorialSummary: (p.editorialSummary as { text?: string })?.text ?? null,
    outdoorSeating: (p.outdoorSeating as boolean) ?? false,
    reservable: (p.reservable as boolean) ?? false,
    servesBeer: (p.servesBeer as boolean) ?? false,
    servesWine: (p.servesWine as boolean) ?? false,
    servesCocktails: (p.servesCocktails as boolean) ?? false,
    servesBreakfast: (p.servesBreakfast as boolean) ?? false,
    servesBrunch: (p.servesBrunch as boolean) ?? false,
    servesLunch: (p.servesLunch as boolean) ?? false,
    servesDinner: (p.servesDinner as boolean) ?? false,
    liveMusic: (p.liveMusic as boolean) ?? false,
    goodForGroups: (p.goodForGroups as boolean) ?? false,
    reviews: reviewList,
  };
}

export async function nearbySearch(
  apiKey: string,
  lat: number,
  lng: number,
  type: string,
  radiusMeters = 1000
): Promise<PlaceFromSearch[]> {
  const url = `${BASE_URL}/places:searchNearby`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': NEARBY_FIELDS,
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Places API Nearby Search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { places?: Record<string, unknown>[] };
  const places = data.places ?? [];
  return places.map(parsePlaceFromResponse);
}

export async function textSearch(
  apiKey: string,
  query: string,
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<PlaceFromSearch[]> {
  const url = `${BASE_URL}/places:searchText`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': NEARBY_FIELDS,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Places API Text Search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { places?: Record<string, unknown>[] };
  const places = data.places ?? [];
  return places.map(parsePlaceFromResponse);
}

export async function placeDetails(apiKey: string, placeId: string): Promise<PlaceDetails> {
  const url = `${BASE_URL}/places/${placeId}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_FIELDS,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Places API Place Details failed: ${res.status} ${err}`);
  }

  const p = (await res.json()) as Record<string, unknown>;
  const base = parsePlaceFromResponse(p);

  const photos = p.photos as Array<{ name?: string }> | undefined;
  const photoRefs = (photos ?? [])
    .map(photo => photo.name?.split('/').pop() ?? null)
    .filter((ref): ref is string => ref !== null)
    .slice(0, 5);
  
  const finalPhotoRefs = photoRefs.length > 0 ? photoRefs : base.photoReferences;
  const finalPhotoRef = finalPhotoRefs.length > 0 ? finalPhotoRefs[0] : null;

  const acc = p.accessibilityOptions as Record<string, boolean> | undefined;
  const park = p.parkingOptions as Record<string, boolean> | undefined;
  const pay = p.paymentOptions as Record<string, boolean> | undefined;

  return {
    ...base,
    photoReference: finalPhotoRef,
    photoReferences: finalPhotoRefs,
    website: (p.websiteUri as string) ?? null,
    phone: (p.nationalPhoneNumber as string) ?? (p.internationalPhoneNumber as string) ?? null,
    openingHours: p.regularOpeningHours ?? null,
    googleMapsUri: (p.googleMapsUri as string) ?? null,
    businessStatus: (p.businessStatus as string) ?? null,
    servesVegetarian: (p.servesVegetarianFood as boolean) ?? false,
    servesHappyHour: (p.servesHappyHour as boolean) ?? false,
    goodForWatchingSports: (p.goodForWatchingSports as boolean) ?? false,
    goodForChildren: (p.goodForChildren as boolean) ?? false,
    menuForChildren: (p.menuForChildren as boolean) ?? false,
    takeout: (p.takeout as boolean) ?? false,
    delivery: (p.delivery as boolean) ?? false,
    dineIn: (p.dineIn as boolean) ?? false,
    curbsidePickup: (p.curbsidePickup as boolean) ?? false,
    allowsDogs: (p.allowsDogs as boolean) ?? false,
    driveThrough: (p.driveThrough as boolean) ?? false,
    wheelchairEntrance: acc?.wheelchairAccessibleEntrance ?? false,
    wheelchairParking: acc?.wheelchairAccessibleParking ?? false,
    wheelchairRestroom: acc?.wheelchairAccessibleRestroom ?? false,
    wheelchairSeating: acc?.wheelchairAccessibleSeating ?? false,
    freeParkingLot: park?.freeParkingLot ?? false,
    freeStreetParking: park?.freeStreetParking ?? false,
    paidParkingLot: park?.paidParkingLot ?? false,
    valetParking: park?.valetParking ?? false,
    acceptsCashOnly: pay?.acceptsCashOnly ?? false,
    acceptsCreditCards: pay?.acceptsCreditCards ?? false,
    acceptsDebitCards: pay?.acceptsDebitCards ?? false,
    acceptsNfc: pay?.acceptsNfc ?? false,
  };
}
