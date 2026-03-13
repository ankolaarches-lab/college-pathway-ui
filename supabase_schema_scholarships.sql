-- Scholarships table for College Pathway Explorer
-- Run this in Supabase SQL Editor

-- Create the scholarships table
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT,
  amount_min INTEGER,
  amount_max INTEGER,
  amount_is_renewable BOOLEAN DEFAULT false,
  deadline_month INTEGER CHECK (deadline_month BETWEEN 1 AND 12),
  deadline_day INTEGER CHECK (deadline_day BETWEEN 1 AND 31),
  deadline_year INTEGER,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  application_url TEXT NOT NULL,
  required_elements TEXT[] DEFAULT '{}'::text[],
  category TEXT,  -- 'passion-based', 'need-based', 'merit', 'demographic', 'field-of-study', 'corporate'
  description TEXT,
  image_url TEXT,
  is_hidden_gem BOOLEAN DEFAULT false,  -- for highlighting under-applying scholarships
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_scholarships_category ON scholarships(category);
CREATE INDEX idx_scholarships_deadline_month ON scholarships(deadline_month);
CREATE INDEX idx_scholarships_provider ON scholarships(provider);
CREATE INDEX idx_scholarships_is_hidden_gem ON scholarships(is_hidden_gem) WHERE is_hidden_gem = true;

-- Enable Row Level Security
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to scholarships" ON scholarships FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for admin)
CREATE POLICY "Allow authenticated users to manage scholarships" ON scholarships 
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scholarships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update
CREATE TRIGGER update_scholarships_updated_at
  BEFORE UPDATE ON scholarships
  FOR EACH ROW
  EXECUTE FUNCTION update_scholarships_updated_at();

-- Insert initial scholarships data
INSERT INTO scholarships (name, provider, amount_min, amount_max, amount_is_renewable, deadline_month, deadline_day, category, eligibility_criteria, application_url, required_elements, description, is_hidden_gem) VALUES
-- Corporate Scholarships
('Live Más Scholarship', 'Taco Bell Foundation', 5000, 25000, false, 1, 15, 'passion-based', '{"us_citizen": true}', 'https://www.tacobellfoundation.org/live-mas-scholarship/', ARRAY['video_essay', 'passion_statement'], 'Passion-based scholarship for students who want to make a difference. No GPA or income requirements.', true),
('Coca-Cola Scholars Program', 'Coca-Cola Scholars Foundation', 20000, 20000, false, 9, 30, 'merit', '{"min_gpa": 3.0}', 'https://www.coca-colascholarsfoundation.org/apply/', ARRAY['application', 'transcript', 'essay'], '150 $20,000 scholarships for high school seniors demonstrating leadership and service.', true),
('Burger King Scholars Program', 'Burger King McLAMORE Foundation', 1000, 50000, false, 12, 15, 'need-based', '{"min_gpa": 2.5}', 'https://www.burgerkingscholars.org/', ARRAY['application', 'essay'], 'Need and merit-based scholarships for employees, families of employees, or community service.', false),
('McDonald''s HACER Scholarship', 'McDonald''s HACER', 1000, 100000, false, 3, 1, 'demographic', '{"hispanic_heritage": true}', 'https://mcdonalds.com/hacer/', ARRAY['application', 'essay', 'transcript'], 'For Hispanic students pursuing higher education.', true),
('Starbucks Beyond the Bar Scholarship', 'Starbucks', 10000, 10000, true, 6, 30, 'employment', '{"starbucks_partner": true}', 'https://starbucks.com/scholarship/', ARRAY['application'], 'For Starbucks partners (employees) pursuing degree programs.', false),

-- Weird/Unique Scholarships
('Duck Brand Stuck At Prom Scholarship', 'Duck Brand', 500, 15000, false, 6, 30, 'creative', '{}', 'https://www.stuckatprom.com/', ARRAY['photo_essay'], 'Design and create a prom outfit entirely out of Duck tape.', true),
('Jif Most Creative Sandwich Scholarship', 'Jif Peanut Butter', 2500, 2500, false, 5, 1, 'creative', '{}', 'https://www.jif.com/scholarship', ARRAY['essay'], 'Write about your most creative sandwich creation.', false),
('Vegetarian Resource Group Scholarship', 'VRG', 5000, 10000, false, 7, 15, 'demographic', '{"vegetarian": true}', 'https://www.vrg.org/scholarship/', ARRAY['essay'], 'For vegetarian/vegan students.', false),

-- Merit-Based
('Elks National Foundation Most Valuable Student', 'Elks Lodge', 1000, 15000, true, 12, 1, 'merit', '{"min_gpa": 3.0}', 'https://www.elks.org/scholarships/mvs.cfm', ARRAY['application', 'essay', 'interview'], 'Competition based on leadership, merit, and financial need.', false),
('Horatio Alger Scholarship', 'Horatio Alger Association', 2000, 25000, false, 7, 15, 'need-based', '{"min_gpa": 2.0}', 'https://scholarships.horatioalger.org/', ARRAY['application', 'essay'], 'For students overcoming adversity to pursue higher education.', true),
('Ron Brown Scholar Program', 'Ron Brown Scholar Program', 40000, 40000, true, 12, 1, 'demographic', '{"african_american": true, "min_gpa": 2.8}', 'https://ronbrownscholars.org/', ARRAY['application', 'essay', 'recommendations'], 'For African American high school seniors demonstrating leadership.', true),
('Dell Scholars Program', 'Michael & Susan Dell Foundation', 20000, 20000, true, 1, 4, 'need-based', '{"min_gpa": 2.4}', 'https://www.dellscholars.org/', ARRAY['application', 'essay'], 'For students who have overcome significant obstacles.', true),

-- STEM/Specific Fields
('NOAA Ernest F. Hollings Scholarship', 'NOAA', 8000, 8000, true, 1, 31, 'field-of-study', '{"stem": true}', 'https://www.noaa.gov/office-education/hollings-scholarship', ARRAY['application', 'essay'], 'For students pursuing degrees in oceanic, atmospheric, or Earth sciences.', true),
('USDA/1890 National Scholars Program', 'USDA', 2000, 20000, true, 3, 1, 'field-of-study', '{"min_gpa": 2.5}', 'https://www.usda.gov/1890scholars', ARRAY['application', 'transcript', 'essay'], 'For students attending 1890 land-grant universities in agriculture-related fields.', true),
('Chef''s Catalog Culinary Scholarship', 'Chef''s Catalog', 2500, 2500, false, 4, 30, 'field-of-study', '{"culinary": true}', 'https://www.chefscatalog.com/scholarship/', ARRAY['essay'], 'For culinary school students.', false),

-- Financial Need
('Gates Millennium Scholars', 'Bill & Melinda Gates Foundation', 500, 20000, true, 1, 15, 'need-based', '{"min_gpa": 2.5, "african_american": true}', 'https://www.gmsp.org/', ARRAY['application', 'essay', 'recommendations'], 'For high-achieving minority students with significant financial need.', true),
('Jack Kent Cooke Foundation', 'Jack Kent Cooke Foundation', 40000, 40000, true, 12, 5, 'merit', '{"min_gpa": 3.5}', 'https://www.jkcf.org/scholarships/', ARRAY['application', 'essay'], 'For high-achieving students with financial need.', true),

-- Local/Regional (examples to add more later)
('State Aid - Cal Grant', 'California Student Aid Commission', 0, 15000, true, 3, 2, 'need-based', '{"state_resident": true, "state": "CA"}', 'https://www.csac.ca.gov/cal-grant', ARRAY['fafsa'], 'California state need-based grant for resident students.', false),
('State Aid - TAP', 'New York Higher Education Services', 0, 5500, true, 6, 30, 'need-based', '{"state_resident": true, "state": "NY"}', 'https://www.tap.hesc.ny.gov/', ARRAY['fafsa'], 'New York Tuition Assistance Program for resident students.', false);

-- Note: Add more state grants, local scholarships, and field-specific scholarships as needed
