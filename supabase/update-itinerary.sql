-- Run this in Supabase SQL Editor to replace placeholder data with Marlowe's real itinerary
-- Current location (Barcelona) is already correct

-- Clear placeholder visited places and stops
DELETE FROM visited_places;
DELETE FROM potential_stops;

-- Their confirmed upcoming stops
INSERT INTO potential_stops (city, country, lat, lng, note) VALUES
  ('San Francisco', 'United States', 37.7749, -122.4194, 'Bay Area — Aug 30 - Sept 7 & Nov 1-14'),
  ('Lisbon', 'Portugal', 38.7223, -9.1393, 'Sept 8-10'),
  ('Ponta Delgada', 'Portugal', 37.7483, -25.6666, 'Sao Miguel Island — Sept 11-14'),
  ('Porto', 'Portugal', 41.1579, -8.6291, 'Sept 14-16'),
  ('San Diego', 'United States', 32.7157, -117.1611, 'Oct 11-31'),
  ('Portland', 'United States', 45.5152, -122.6784, 'Oregon — Nov 15-29'),
  ('Seattle', 'United States', 47.6062, -122.3321, 'Washington State — Nov 30 - Dec 12'),
  ('Coeur d''Alene', 'United States', 47.6777, -116.7805, 'Idaho (+ Moscow) — Dec 13-27'),
  ('Paris', 'France', 48.8566, 2.3522, 'France — Dec 28 - Jan 31'),
  ('London', 'England', 51.5074, -0.1278, 'England — Dec 28 - Jan 31');
