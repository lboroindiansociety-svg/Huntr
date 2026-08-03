-- Trackr programme cache (per user) + sync metadata
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS trackr_programmes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trackr_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company_id TEXT,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  job_url TEXT,
  careers_site TEXT,
  region TEXT NOT NULL,
  industry TEXT NOT NULL,
  season TEXT NOT NULL,
  programme_type TEXT NOT NULL DEFAULT 'graduate-programmes',
  categories TEXT[] DEFAULT '{}',
  opening_date TIMESTAMPTZ,
  closing_date TIMESTAMPTZ,
  last_year_opening TIMESTAMPTZ,
  cv_required BOOLEAN,
  cover_letter TEXT,
  written_answers TEXT,
  sponsors_visa TEXT,
  raw JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, trackr_id)
);

CREATE INDEX IF NOT EXISTS idx_trackr_programmes_user_filters
  ON trackr_programmes (user_id, region, industry, season, programme_type);

CREATE TABLE IF NOT EXISTS trackr_sync_meta (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT,
  industry TEXT,
  season TEXT,
  programme_type TEXT,
  last_synced_at TIMESTAMPTZ,
  programme_count INTEGER
);

ALTER TABLE trackr_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trackr_sync_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trackr programmes" ON trackr_programmes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own trackr sync meta" ON trackr_sync_meta
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optional dedup column on user internships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'internships' AND column_name = 'trackr_id'
  ) THEN
    ALTER TABLE internships ADD COLUMN trackr_id TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_internships_trackr_id ON internships (trackr_id)
  WHERE trackr_id IS NOT NULL;
