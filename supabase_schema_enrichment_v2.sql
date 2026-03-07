-- Add columns for external data enrichment
-- Run this in Supabase SQL Editor

ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS city_crime_stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS local_housing_stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS local_economic_stats JSONB DEFAULT '{}'::jsonb;

-- Comment describing the structure
COMMENT ON COLUMN institutions.city_crime_stats IS 'Stores FBI agency-level crime data (violent/property rates)';
COMMENT ON COLUMN institutions.local_housing_stats IS 'Stores HUD Fair Market Rent data (0BR, 1BR, 2BR, etc.)';
COMMENT ON COLUMN institutions.local_economic_stats IS 'Stores Census data (Median Income, etc.)';
