-- Add coordinates to institutions table
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create a Haversine distance function to calculate miles between two lat/lon points
-- This allows us to query colleges within X miles of a user's ZIP code
CREATE OR REPLACE FUNCTION get_distance_miles(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 3958.8; -- Earth radius in miles
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  lat1 := lat1 * pi() / 180;
  lon1 := lon1 * pi() / 180;
  lat2 := lat2 * pi() / 180;
  lon2 := lon2 * pi() / 180;

  dlat := lat2 - lat1;
  dlon := lon2 - lon1;

  a := sin(dlat / 2)^2 + cos(lat1) * cos(lat2) * sin(dlon / 2)^2;
  c := 2 * asin(sqrt(a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an RPC (Remote Procedure Call) to find colleges within a radius
-- This can be called directly from our Next.js API using: 
-- supabase.rpc('search_colleges_by_distance', { origin_lat: X, origin_lon: Y, max_distance_miles: Z })
CREATE OR REPLACE FUNCTION search_colleges_by_distance(
  origin_lat DOUBLE PRECISION,
  origin_lon DOUBLE PRECISION,
  max_distance_miles DOUBLE PRECISION
)
RETURNS SETOF institutions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM institutions
  WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND get_distance_miles(origin_lat, origin_lon, latitude, longitude) <= max_distance_miles
  ORDER BY get_distance_miles(origin_lat, origin_lon, latitude, longitude) ASC;
END;
$$ LANGUAGE plpgsql STABLE;
