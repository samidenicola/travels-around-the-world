# Travels Around the World -- Developer Handoff

A scrapbook-style illustrated travel map for Marlowe & Sebastien's trip around the world. Visitors see an illustrated world map with animated pins showing where they are now, where they've been, and where they might go next. Friends and family can leave notes. Marlowe manages everything through a hidden admin dashboard (no login page -- secret keyboard shortcut).

**Live:** https://travels-around-the-world.vercel.app

## Tech Stack

- **Frontend:** Vite + vanilla JS (no framework), CSS modules per feature
- **Backend:** Supabase (Postgres + Row Level Security + Edge Functions + Storage)
- **Hosting:** Vercel (static site)
- **Map:** Custom illustrated image with percentage-positioned pins (no Leaflet/Mapbox)
- **Fonts:** Caveat, Patrick Hand, Inter (Google Fonts)

## Run Locally

```bash
git clone https://github.com/samidenicola/travels-around-the-world.git
cd travels-around-the-world
npm install
cp .env.example .env   # fill in Supabase values (see Env Vars below)
npm run dev             # localhost:5173
```

Without a `.env` file (or with empty values), the app runs in **demo mode** with hardcoded sample data -- no Supabase needed to see the UI.

## Project Structure

```
index.html                  Entry point
src/
  main.js                   App bootstrap, loads data, inits all modules
  state.js                  Reactive state store (pub/sub pattern)
  supabase.js               Supabase client, data fetching, admin actions, demo fallbacks
  utils.js                  Shared helpers (escapeHtml, escapeAttr)
  style.css                 Global styles, CSS variables, textures
  modules/
    map-surface.js/css      Map container, header, legend, attribution
    markers.js/css           Pin rendering (current/visited/stop), placement mode for admin
    hover-cards.js/css       Polaroid-style tooltip cards on pin hover/click, photo gallery
    note-flow.js/css         Postcard note-leaving form (public)
    passphrase.js/css        Admin auth overlay (setup, login, recovery)
    dashboard.js/css         Admin panel (CRUD locations, view notes, upload photos)
    journey-summary.js/css   SVG trail line + stats card
    export.js/css            Note export/filtering (CSV, clipboard) for admin
public/
  marlowe-map.png           The illustrated world map image
  favicon.svg               Pin favicon
  icons.svg                 UI icon sprites
supabase/
  schema.sql                Full DB schema + RLS policies + seed data
  edge-function.ts          Admin edge function (verify passphrase, CRUD, photo upload)
  setup-storage.sql         Storage bucket + policies for location photos
  *.sql                     Migration scripts (add columns, fix permissions, etc.)
vercel.json                 SPA rewrite rule
.github/workflows/
  keep-alive.yml            Pings Supabase every 5 days to prevent free-tier hibernation
```

## Supabase Setup

### Tables

- **current_location** -- singleton row with city, country, lat/lng, x_pct/y_pct (map position)
- **visited_places** -- cities they've been to, with dates and photo URLs (image_urls array)
- **potential_stops** -- "maybe" cities with optional notes
- **notes** -- messages from friends/family (public INSERT only, admin-only read via edge function)
- **admin_config** -- hashed passphrase + recovery phrase (one row, fully locked to service role)

### Row Level Security

- Location tables: public SELECT, no public write
- Notes: public INSERT only (must have non-empty author + message), no public read/update/delete
- admin_config: no anon access at all -- only the edge function (service role) can read it

### Edge Function

Named `admin` in Supabase. Handles all authenticated operations: verify passphrase, CRUD for locations, get/export notes, upload photos. Uses the service role key (server-side only) to bypass RLS. See `supabase/edge-function.ts` for the full source.

### Storage

Bucket `location-photos` (public read). Photos are uploaded via the edge function as base64, stored at `{location_id}/{uuid}.{ext}`, and the public URL is appended to the visited place's `image_urls` array.

### Setting Up a New Supabase Project

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the SQL Editor (creates tables + RLS + seed data)
3. Run `supabase/setup-storage.sql` (creates photo storage bucket)
4. Create an Edge Function named `admin`, paste in `supabase/edge-function.ts`
5. Copy the project URL, anon key, and function URL into your `.env`

## How Admin Auth Works

There is no login page. The admin flow:

1. Press **Ctrl+5** (or Cmd+5 on Mac) anywhere on the site
2. First time: **setup** form appears (set passphrase + recovery phrase)
3. Returning: **login** form appears (enter passphrase)
4. Passphrase is hashed with SHA-256 + salt and verified server-side via the edge function
5. On success: a journal/book icon appears top-right -- click it (or Ctrl+5 again) to reopen the admin dashboard
6. Passphrase is held in memory only (never localStorage)
7. The dashboard lets you: update current location, add/edit/delete visited places, add/remove potential stops, view notes, upload photos, export notes
8. If passphrase is forgotten: "forgot it?" link triggers recovery using the recovery phrase set during setup

## How Markers Work

The map is an **illustrated image** (`public/marlowe-map.png`), not a tile-based map. Pin positions are stored as **percentages** (`x_pct`, `y_pct`) relative to the image dimensions:

- `x_pct: 0` = left edge, `x_pct: 100` = right edge
- `y_pct: 0` = top edge, `y_pct: 100` = bottom edge

In admin mode, there's a **placement mode**: click "place on map" in the dashboard, then click on the map image. The click coordinates are converted to percentages and saved. No geocoding or lat/lng is needed for display.

Three pin types with distinct SVG designs:
- **Red pin** -- current location (animated pulse rings)
- **Brown pin** -- visited place
- **Gray dashed pin** -- potential stop

## Deploy

### Via Vercel CLI

```bash
vercel --prod
```

### Auto-deploy via Git integration

If the GitHub repo is connected in Vercel (project settings > Git), pushing to `main` auto-deploys. To connect:

1. Go to https://vercel.com > project settings > Git
2. Connect the `samidenicola/travels-around-the-world` repo
3. Set production branch to `main`

## Env Vars

Set these in Vercel project settings (Settings > Environment Variables) or via `vercel env add`:

- `VITE_SUPABASE_URL` -- Supabase project URL (e.g. `https://xxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` -- Supabase anon/public key
- `VITE_SUPABASE_PUBLISHABLE_KEY` -- Supabase publishable key (used in edge function auth header)
- `VITE_SUPABASE_FUNCTION_URL` -- Full URL to the admin edge function (e.g. `https://xxx.supabase.co/functions/v1/edge-function`)

All are `VITE_` prefixed so Vite injects them at build time. The anon key is safe to expose (RLS protects the data). The real secret (service role key) lives only in the Supabase edge function environment.

## Add a Collaborator

```bash
gh repo add-collaborator USERNAME --repo samidenicola/travels-around-the-world
```

## Keep-Alive

The GitHub Action `.github/workflows/keep-alive.yml` pings Supabase every 5 days to prevent the free-tier project from hibernating. Requires a `SUPABASE_ANON_KEY` repo secret in GitHub repo settings (Settings > Secrets > Actions).
