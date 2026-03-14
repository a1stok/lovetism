/**
 * Toronto grid points - 3km radius from Bahen Centre (UofT)
 * Covers: Kensington, Chinatown, Queen West, King West, Dundas, College,
 * Annex, Yorkville, Distillery, Harbourfront, etc.
 */

/** 6 points covering ~3km from Bahen — fast mode (SKIP_GEMINI=1 or COMPACT=1) */
export const COMPACT_GRID = [
  { lat: 43.6596, lng: -79.3978, area: 'UofT/Bahen' },
  { lat: 43.6686, lng: -79.3978, area: 'Annex' },
  { lat: 43.6506, lng: -79.3978, area: 'Queen West' },
  { lat: 43.6596, lng: -79.3828, area: 'Downtown' },
  { lat: 43.6596, lng: -79.4128, area: 'Kensington' },
  { lat: 43.6526, lng: -79.3878, area: 'Entertainment District' },
] as const;

export const TORONTO_GRID = [
  { lat: 43.6596, lng: -79.3978, area: 'UofT/Bahen' },
  { lat: 43.6686, lng: -79.3978, area: 'Annex North' },
  { lat: 43.6506, lng: -79.3978, area: 'Queen West' },
  { lat: 43.6596, lng: -79.3828, area: 'Downtown Core' },
  { lat: 43.6596, lng: -79.4128, area: 'Kensington' },
  { lat: 43.6666, lng: -79.4078, area: 'Little Italy' },
  { lat: 43.6666, lng: -79.3878, area: 'Yorkville South' },
  { lat: 43.6526, lng: -79.4078, area: 'Trinity Bellwoods' },
  { lat: 43.6526, lng: -79.3878, area: 'Entertainment District' },
  { lat: 43.6776, lng: -79.3978, area: 'Dupont' },
  { lat: 43.6416, lng: -79.3978, area: 'King West' },
  { lat: 43.6596, lng: -79.3678, area: 'Bay Street' },
  { lat: 43.6596, lng: -79.4278, area: 'Dufferin Grove' },
  { lat: 43.6736, lng: -79.4228, area: 'Seaton Village' },
  { lat: 43.6736, lng: -79.3728, area: 'Rosedale South' },
  { lat: 43.6456, lng: -79.4228, area: 'Parkdale East' },
  { lat: 43.6456, lng: -79.3728, area: 'Distillery' },
  { lat: 43.6866, lng: -79.3978, area: 'Casa Loma' },
  { lat: 43.6326, lng: -79.3978, area: 'Harbourfront' },
  { lat: 43.6596, lng: -79.3528, area: 'Corktown' },
  { lat: 43.6596, lng: -79.4428, area: 'Roncesvalles' },
  { lat: 43.6806, lng: -79.4378, area: 'Dovercourt' },
  { lat: 43.6806, lng: -79.3578, area: 'Summerhill' },
  { lat: 43.6386, lng: -79.4378, area: 'Parkdale' },
  { lat: 43.6386, lng: -79.3578, area: 'St Lawrence' },
  { lat: 43.6636, lng: -79.4028, area: 'Harbord Village' },
  { lat: 43.6556, lng: -79.3878, area: 'Chinatown' },
  { lat: 43.6476, lng: -79.4028, area: 'Beaconsfield' },
] as const;
