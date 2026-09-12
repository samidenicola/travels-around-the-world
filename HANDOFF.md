# Travels Around the World

A scrapbook-style travel map for Marlowe & Sebastien. Friends and family visit to see where they are, where they've been, and leave notes. Marlowe manages everything through a secret admin dashboard.

**Live:** https://travels-around-the-world.vercel.app

## Tech Stack

- **Frontend:** Vite + vanilla JS (no framework)
- **Backend:** Supabase (Postgres, Edge Functions, Storage)
- **Hosting:** Vercel (static)
- **Map:** Custom illustrated image with absolutely positioned pins (no Leaflet/Mapbox)

## Run Locally

```bash
npm install
cp .env.example .env   # fill in Supabase values
npm run dev             # localhost:5173
```

## Project Structure

```
src/
  main.js              # entry point
  supabase.js          # Supabase client, API functions, demo fallback
  state.js             # pub/sub state management
  utils.js             # shared escapeHtml/escapeAttr
  style.css            # global styles, CSS variables, textures
  modules/
    map-surface.*      # map image, header, legend, attribution
    markers.*          # 3 pin types (current/visited/stops), placement mode
    hover-cards.*      # polaroid cards on pin hover/click, photo gallery
    note-flow.*        # postcard note-leaving form
    passphrase.*       # Ctrl+5 admin auth (setup/login/recovery)
    dashboard.*        # admin panel (stacked sections, CRUD, photo upload)
    journey-summary.*  # SVG trail line + stats card
    export.*           # CSV/clipboard export for notes

public/
  marlowe-map.png      # the illustrated world map

supabase/
  schema.sql           # table definitions + RLS + seed data
  edge-function.ts     # admin API (passphrase auth, CRUD, photo upload)
  setup-storage.sql    # photo storage bucket
  fix-permissions-and-data.sql
  make-lat-lng-nullable.sql
```

## Supabase Tables

- `current_location` -- singleton, where they are now (city, country, x_pct, y_pct)
- `visited_places` -- places they've been, with optional photos (image_urls array)
- `potential_stops` -- future destinations
- `notes` -- messages from friends (INSERT-only for anon, read via edge function)
- `admin_config` -- hashed passphrase + recovery phrase (fully locked down)

## How Admin Auth Works

1. Marlowe presses **Ctrl+5** (or Cmd+5)
2. First time: sets a passphrase + recovery phrase (hashed server-side via edge function)
3. Returning: enters passphrase, verified by edge function against stored hash
4. On success: admin dashboard opens, book icon appears top-right for quick re-access
5. Passphrase is held in memory only (never localStorage)

## How Pins Work

Pins are positioned on the illustrated map image using **x_pct / y_pct** (percentage of image width/height). No geocoding or lat/lng needed for display. Admin places pins by clicking on the map.

## Deploy

Push to `main` and run `vercel --prod`, or set up Vercel Git integration for auto-deploy.

### Env Vars (set in Vercel dashboard)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_FUNCTION_URL`

## Add a Collaborator

```bash
gh repo add-collaborator USERNAME --repo samidenicola/travels-around-the-world
```

## Keep-Alive

GitHub Actions pings Supabase every 5 days to prevent free-tier pausing. Add `SUPABASE_ANON_KEY` as a repo secret for it to work.
