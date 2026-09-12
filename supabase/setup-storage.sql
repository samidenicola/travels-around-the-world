-- ============================================================
-- Storage setup for location photos
-- Run this in the Supabase SQL Editor after the main schema
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('location-photos', 'location-photos', true);

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'location-photos');

CREATE POLICY "Admin can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'location-photos');

CREATE POLICY "Admin can delete photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'location-photos');
