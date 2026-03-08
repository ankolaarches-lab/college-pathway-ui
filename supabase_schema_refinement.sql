-- Refinement schema for College Pathway
-- Adding community vouching (voting) system

CREATE TABLE IF NOT EXISTS contribution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contribution_id UUID REFERENCES user_contributions(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contribution_id)
);

-- RLS for votes
ALTER TABLE contribution_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON contribution_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote once" ON contribution_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update contribution votes count and award bonus points
CREATE OR REPLACE FUNCTION handle_contribution_vote()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id UUID;
BEGIN
  -- 1. Update the sum of votes in user_contributions
  UPDATE user_contributions
  SET votes = (SELECT count(*) FROM contribution_votes WHERE contribution_id = NEW.contribution_id)
  WHERE id = NEW.contribution_id;

  -- 2. Get the author of the contribution
  SELECT user_id INTO v_author_id FROM user_contributions WHERE id = NEW.contribution_id;

  -- 3. Award bonus points to the author (+5 per vouch)
  UPDATE user_profiles
  SET points = points + 5
  WHERE id = v_author_id;

  -- 4. Check if threshold reached for "Verified" status
  IF (SELECT count(*) FROM contribution_votes WHERE contribution_id = NEW.contribution_id) >= 3 THEN
    UPDATE user_contributions
    SET verification_status = 'verified'
    WHERE id = NEW.contribution_id AND verification_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_created ON contribution_votes;
CREATE TRIGGER on_vote_created
  AFTER INSERT ON contribution_votes
  FOR EACH ROW EXECUTE FUNCTION handle_contribution_vote();
