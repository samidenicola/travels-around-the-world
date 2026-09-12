-- ============================================================
-- Travels Around the World — Supabase Schema
-- Paste this into the SQL Editor in the Supabase dashboard
-- ============================================================

-- Current location (singleton — Marlowe updates this)
create table current_location (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  x_pct double precision,
  y_pct double precision,
  updated_at timestamptz default now()
);

-- Places they've already visited
create table visited_places (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  x_pct double precision,
  y_pct double precision,
  date_from text,          -- flexible: "March 2026", "2026-03-15", etc.
  date_to text,
  image_urls text[] default '{}',
  created_at timestamptz default now()
);

-- Potential next stops (the "maybe" list)
create table potential_stops (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  x_pct double precision,
  y_pct double precision,
  note text,
  created_at timestamptz default now()
);

-- Notes from friends & family
create table notes (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) > 0),
  message text not null check (char_length(message) > 0),
  location_context text,  -- auto-filled with their current city at time of note
  created_at timestamptz default now()
);

-- Admin passphrase config (one row, ever)
create table admin_config (
  id uuid primary key default gen_random_uuid(),
  passphrase_hash text not null,
  passphrase_salt text not null,
  recovery_hash text not null,
  recovery_salt text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table current_location enable row level security;
alter table visited_places enable row level security;
alter table potential_stops enable row level security;
alter table notes enable row level security;
alter table admin_config enable row level security;

-- Public can READ location data (the whole point of the map)
create policy "anon_read_current_location" on current_location for select using (true);
create policy "anon_read_visited_places"   on visited_places   for select using (true);
create policy "anon_read_potential_stops"   on potential_stops  for select using (true);

-- Public can INSERT notes (but never read, update, or delete them)
create policy "anon_insert_notes" on notes for insert with check (
  char_length(author_name) > 0 and char_length(message) > 0
);

-- admin_config: NO anon policies → completely locked to anon key

-- ============================================================
-- Seed data (placeholder — Marlowe updates via dashboard)
-- ============================================================

insert into current_location (city, country, lat, lng, x_pct, y_pct)
values ('Barcelona', 'Spain', 41.3874, 2.1686, 51, 35);

insert into visited_places (city, country, lat, lng, x_pct, y_pct, date_from, date_to) values
  ('Paris', 'France', 48.8566, 2.3522, 50, 30, 'June 2026', 'June 2026'),
  ('London', 'England', 51.5074, -0.1278, 49, 27, 'May 2026', 'May 2026'),
  ('Amsterdam', 'Netherlands', 52.3676, 4.9041, 50.5, 28, 'July 2026', 'July 2026');

insert into potential_stops (city, country, lat, lng, x_pct, y_pct, note) values
  ('Lisbon', 'Portugal', 38.7223, -9.1393, 45, 37, 'Heard amazing things about the food scene'),
  ('Santorini', 'Greece', 36.3932, 25.4615, 55, 38, 'Dream sunset spot');
