# Lovetism

AI-powered date planning app for couples. Generate personalized date itineraries from your journals, save favorites, sync past dates with partners, and keep shared journals. The AI factors in weather and both partners' preferences and returns fully routed itineraries with arrival times and spend estimates.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, TanStack Router, Tailwind, Radix UI, shadcn/ui, TipTap |
| Backend | Node.js, Express 5, TypeScript |
| Database | Supabase (PostgreSQL, Auth, Storage, RLS), PostGIS for geospatial queries |
| AI | Groq (Llama 3.3 70B) for date generation, Gemini for place enrichment and backfill |
| Maps | Google Places, Directions API, Maps JS API, OSRM fallback for routes |
| Weather | Open-Meteo |

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase project
- Groq API key (date generation)
- Gemini API key (place enrichment, `populate-places`, `backfill-vibes`)
- Google Places API key (Places + Directions enabled)

### 1. Clone & Install

```bash
git clone https://github.com/a1stok/lovetism.git
cd lovetism
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_PLACES_API_KEY=your_places_key
```

**Backend** (`backend/.env`):

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key   # for populate-places, backfill-vibes
```

### 3. Database

```bash
cd backend
npx supabase db push   # or link + push if using remote
```

### 4. Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

App: http://localhost:5173 | API: http://localhost:4000

## Features

- **Date Ideas** AI-generated itineraries (Groq/Llama) with curated places, map routes (Google Directions + OSRM fallback), weather
- **Saved Dates** Save favorites, add partner, toggle past/saved
- **Past Dates** Per-stop feedback, sync with partner, link saved to past
- **Journal** Shared journals, folders/files, TipTap rich text, cover images
- **Profile** Avatar, nickname, partners by nickname
- **Partnerships** Invite by nickname, accept/decline

## Scripts

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | frontend | Vite dev server |
| `npm run dev` | backend | Express + tsx watch |
| `npm run build` | frontend | Vite production build |
| `npm run populate-places` | backend | Curated places (Places + Gemini) |
| `npm run backfill-vibes` | backend | AI vibes for places (Gemini/Groq/OpenAI) |

## Supabase Setup

1. Create project at supabase.com
2. Run migrations: `npx supabase db push`
3. Enable Auth (Email)
4. Create storage buckets: `avatars`, `journal-assets` (or use migrations)
5. Add RLS policies (included in migrations)

## API Keys

| Service | Used For |
|---------|----------|
| Supabase | Auth, DB, Storage |
| Groq | Date idea generation (Llama 3.3 70B) |
| Gemini | Place enrichment, vibe extraction, `populate-places`, `backfill-vibes` |
| Google Places | Place search, photos, Directions, Maps |
| Open-Meteo | Weather (no key) |
| OSRM | Map route fallback when Directions fails (no key) |

