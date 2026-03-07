-- Add crime_stats and description to institutions table
-- Run this in Supabase SQL Editor

ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS crime_stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS description TEXT;
