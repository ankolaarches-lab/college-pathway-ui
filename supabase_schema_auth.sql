-- Enhanced schema for College Pathway Explorer with auth, favorites, and transfer pathways
-- Run this in Supabase SQL Editor to update your database

-- 1. Create auth-related tables
-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  user_mode TEXT DEFAULT 'student' CHECK (user_mode IN ('student', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorite colleges
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);

-- User search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_query TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create transfer pathway tables
-- Transfer pathways (articulation agreements)
CREATE TABLE IF NOT EXISTS transfer_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_institution_id BIGINT NOT NULL,
  target_institution_id BIGINT NOT NULL,
  agreement_type TEXT, -- e.g., "automatic", "pathway", "guaranteed"
  requirements TEXT, -- e.g., "2.5 GPA, 60 credits"
  program TEXT, -- e.g., "Business", "Engineering"
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_institution_id, target_institution_id, program)
);

-- 3. Add additional IPEDS fields to institutions table
-- First, add new columns for enhanced data
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS student_faculty_ratio JSONB DEFAULT '{}'::jsonb;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS loan_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS crime_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS transfer JSONB DEFAULT '{}'::jsonb;

-- 4. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_institution ON favorites(institution_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_pathways_source ON transfer_pathways(source_institution_id);
CREATE INDEX IF NOT EXISTS idx_transfer_pathways_target ON transfer_pathways(target_institution_id);

-- 5. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_pathways ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Create policies for favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create policies for search_history
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Transfer pathways - public read, only service role can write
CREATE POLICY "Anyone can view transfer pathways" ON transfer_pathways
  FOR SELECT USING (true);

-- 10. Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, user_mode)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
