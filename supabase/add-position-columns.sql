-- Migration: add x_pct / y_pct columns for illustrated-map pin placement
-- Run this in the Supabase SQL Editor

ALTER TABLE current_location ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE current_location ADD COLUMN IF NOT EXISTS y_pct double precision;
ALTER TABLE visited_places ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE visited_places ADD COLUMN IF NOT EXISTS y_pct double precision;
ALTER TABLE potential_stops ADD COLUMN IF NOT EXISTS x_pct double precision;
ALTER TABLE potential_stops ADD COLUMN IF NOT EXISTS y_pct double precision;

-- Update current location with approximate position on the illustrated map
-- Barcelona is roughly at x=51%, y=35% on a standard world map
UPDATE current_location SET x_pct = 51, y_pct = 35;
