# Scaling Playbook

## Backend (BE)
* **Current:** Express.js 
* **When to switch:** When API routes hit ~20+ features and get messy.
* **To:** NestJS (Forces clean architecture for large teams).

## Database (DB)
* **Current:** Supabase JS Client (Acts as DB + ORM).
* **When to switch:** Complex relational queries become too hard to manage with JS client alone.
* **To:** Prisma or Drizzle ORM.

## Frontend (FE)
* **Current:** React (Vite SPA).
* **When to switch:** Need SEO for public pages or if first-load JS size gets too big.
* **To:** Next.js (App Router for SSR/SEO). *Note: Relatively easy switch since we just move components to the App Router.*

## Auth
* **Current:** Supabase `localStorage` JWTs.
* **When to switch:** Handling very sensitive data or when moving to Next.js.
* **To:** Supabase Server-Side secure `HttpOnly` cookies.

## Hosting
* **Current:** Supabase Storage.
* **When to switch:** High volume of large 4K videos/images crushing bandwidth.
* **To:** Cloudinary (auto-compression & CDN).

## Architecture (Monolith vs. Microservices)
* **Current:** Monolith (Frontend + Single Express Backend).
* **When to switch:** Only look into Microservices *after* hitting massive organizational scale (e.g., millions of active users or multiple isolated engineering teams).
* **To:** Decoupled Microservices (e.g., an independent Image Processing service, a separate Billing service, etc.). Do not touch this until all other scale upgrades above are exhausted.
