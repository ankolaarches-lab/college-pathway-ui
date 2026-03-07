-- Create the programs table to store field-of-study level data
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id BIGINT REFERENCES institutions(id) ON DELETE CASCADE,
  cip_code TEXT NOT NULL,
  title TEXT NOT NULL,
  credential_level INTEGER NOT NULL,
  credential_title TEXT,
  median_earnings INTEGER,
  median_debt INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, cip_code, credential_level)
);

-- Indexes for fast querying by institution and sorting by outcomes
CREATE INDEX IF NOT EXISTS idx_programs_inst ON programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_earnings ON programs(median_earnings DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_programs_cip ON programs(cip_code);

-- Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to programs" ON programs FOR SELECT USING (true);

-- Function to auto-update updated_at timestamp (re-creating just in case)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
