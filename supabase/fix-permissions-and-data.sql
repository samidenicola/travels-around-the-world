-- ============================================================
-- FIX: Grant permissions (needed because auto-expose was off)
-- ============================================================

-- Public map data: anon can READ
GRANT SELECT ON current_location TO anon;
GRANT SELECT ON visited_places TO anon;
GRANT SELECT ON potential_stops TO anon;

-- Notes: anon can INSERT (but NOT read/update/delete -- RLS handles this too)
GRANT INSERT ON notes TO anon;

-- Also grant to authenticated role (edge functions use service_role which bypasses, but just in case)
GRANT ALL ON current_location TO authenticated;
GRANT ALL ON visited_places TO authenticated;
GRANT ALL ON potential_stops TO authenticated;
GRANT ALL ON notes TO authenticated;
GRANT ALL ON admin_config TO authenticated;

-- ============================================================
-- ADD x_pct / y_pct columns (for image-based map positioning)
-- ============================================================

ALTER TABLE current_location ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE current_location ADD COLUMN IF NOT EXISTS y_pct double precision;
ALTER TABLE visited_places ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE visited_places ADD COLUMN IF NOT EXISTS y_pct double precision;
ALTER TABLE potential_stops ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE potential_stops ADD COLUMN IF NOT EXISTS y_pct double precision;

-- ============================================================
-- UPDATE DATA: Real itinerary with map positions
-- ============================================================

-- Set Barcelona position on the illustrated map
UPDATE current_location SET x_pct = 51, y_pct = 35;

-- Clear placeholder stops and add real ones
DELETE FROM visited_places;
DELETE FROM potential_stops;

INSERT INTO potential_stops (city, country, lat, lng, x_pct, y_pct, note) VALUES
  ('San Francisco', 'United States', 37.77, -122.42, 12, 34, 'Bay Area — Aug 30 - Sept 7 & Nov 1-14'),
  ('Lisbon', 'Portugal', 38.72, -9.14, 45, 37, 'Sept 8-10'),
  ('Ponta Delgada', 'Portugal', 37.75, -25.67, 38, 36, 'Sao Miguel Island — Sept 11-14'),
  ('Porto', 'Portugal', 41.16, -8.63, 45, 35, 'Sept 14-16'),
  ('San Diego', 'United States', 32.72, -117.16, 13, 38, 'Oct 11-31'),
  ('Portland', 'United States', 45.52, -122.68, 11, 28, 'Oregon — Nov 15-29'),
  ('Seattle', 'United States', 47.61, -122.33, 11, 26, 'Washington State — Nov 30 - Dec 12'),
  ('Coeur d''Alene', 'United States', 47.68, -116.78, 14, 27, 'Idaho (+ Moscow) — Dec 13-27'),
  ('Paris', 'France', 48.86, 2.35, 50, 30, 'France — Dec 28 - Jan 31'),
  ('London', 'England', 51.51, -0.13, 49, 27, 'England — Dec 28 - Jan 31');
