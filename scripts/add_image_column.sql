-- Add image_url column to institutions table
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Allow public read/write access to image_url
DROP POLICY IF EXISTS "Allow public update image_url" ON institutions;
CREATE POLICY "Allow public update image_url" ON institutions FOR UPDATE USING (true);
