-- Migration: make lat/lng nullable
-- The dashboard uses x_pct/y_pct for the illustrated map and does not
-- collect lat/lng, so these must be nullable to avoid NOT NULL violations.
-- Run this in the Supabase SQL Editor.

ALTER TABLE current_location ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE current_location ALTER COLUMN lng DROP NOT NULL;
ALTER TABLE visited_places ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE visited_places ALTER COLUMN lng DROP NOT NULL;
ALTER TABLE potential_stops ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE potential_stops ALTER COLUMN lng DROP NOT NULL;
