@AGENTS.md

## Project: Spot
A UK local discovery and personal journal app.

## Tech Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS
- Supabase (auth, database, storage)
- Google Places API (place search and details)
- Deployed on Vercel

## Key Architecture Decisions
- Posts can be public (Explore feed) or private (My Journal only)
- Place data fetched from Google Places API on-demand and cached in Supabase
- Images stored in Supabase Storage bucket: post-images
- Auth via Supabase SSR with cookie-based sessions
- Feed uses separate batched queries instead of PostgREST joins (PGRST201 workaround)
- middleware.ts renamed to proxy.ts for Next.js 16 compatibility

## Database Tables
- profiles (id, username, display_name, avatar_url, bio)
- places (id, google_place_id, name, slug, category, address, city, postcode, lat, lng, google_rating, photo_refs, post_count)
- posts (id, user_id, place_id, title, body, images, tags, rating, rating_food, rating_service, rating_vibe, rating_value, like_count, is_public, created_at)
- likes (user_id, post_id)

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_PLACES_API_KEY
NEXT_PUBLIC_SITE_URL

## Current Features
- My Journal: personal feed of all posts (public + private)
- Explore: public feed of other users' public posts
- Post creation: image upload, place search, multi-dimensional ratings, public/private toggle
- User profiles at /profile/[username]
- Auth: email/password

## Known Issues
- Supabase email confirmation is disabled (turn on before public launch)
- Stray package-lock.json one level above project root (harmless)
