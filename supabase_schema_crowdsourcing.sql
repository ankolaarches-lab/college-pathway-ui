-- Table for crowdsourced data from students
CREATE TABLE IF NOT EXISTS user_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution_id BIGINT NOT NULL,
  program_id BIGINT, -- Optional: link to a specific major/program
  data_type TEXT NOT NULL, -- e.g., 'actual_tuition', 'housing_cost', 'book_cost', 'class_size'
  value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  academic_year INTEGER DEFAULT extract(year from now()),
  description TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update user_profiles to include gamification fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS reputation_level TEXT DEFAULT 'Novice';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_contributions_institution ON user_contributions(institution_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON user_contributions(user_id);

-- RLS Policies
ALTER TABLE user_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contributions" ON user_contributions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own contributions" ON user_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions" ON user_contributions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle points on contribution
CREATE OR REPLACE FUNCTION handle_contribution_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple logic: 10 points per contribution
  UPDATE user_profiles 
  SET points = points + 10
  WHERE id = NEW.user_id;
  
  -- Update reputation level based on points
  UPDATE user_profiles
  SET reputation_level = CASE 
    WHEN points >= 5000 THEN 'Legend'
    WHEN points >= 1000 THEN 'Expert'
    WHEN points >= 500 THEN 'Contributor'
    WHEN points >= 100 THEN 'Explorer'
    ELSE 'Novice'
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points
DROP TRIGGER IF EXISTS on_contribution_created ON user_contributions;
CREATE TRIGGER on_contribution_created
  AFTER INSERT ON user_contributions
  FOR EACH ROW EXECUTE FUNCTION handle_contribution_points();
