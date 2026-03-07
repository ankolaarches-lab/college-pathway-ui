-- Institutions table for College Pathway Explorer
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS institutions;

-- Create the institutions table
CREATE TABLE institutions (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  url TEXT,
  institution_type TEXT,
  enrollment JSONB DEFAULT '{}'::jsonb,
  cost JSONB DEFAULT '{}'::jsonb,
  admissions JSONB DEFAULT '{}'::jsonb,
  completion JSONB DEFAULT '{}'::jsonb,
  earnings JSONB DEFAULT '{}'::jsonb,
  accreditation JSONB DEFAULT '{}'::jsonb,
  loan_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_institutions_state ON institutions(state);
CREATE INDEX idx_institutions_city ON institutions(city);
CREATE INDEX idx_institutions_name ON institutions(name);
CREATE INDEX idx_institutions_type ON institutions(institution_type);

-- Enable Row Level Security
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to institutions" ON institutions FOR SELECT USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update
CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
