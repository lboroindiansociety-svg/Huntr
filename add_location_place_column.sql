-- Add location_place column to existing internships table
-- Run this in your Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE internships 
ADD COLUMN IF NOT EXISTS location_place TEXT;

-- Update existing rows to have empty location_place
UPDATE internships 
SET location_place = '' 
WHERE location_place IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'internships' AND column_name = 'location_place'; 