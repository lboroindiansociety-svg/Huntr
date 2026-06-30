-- Trackr programme cache + sync metadata
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS trackr_programmes (
  trackr_id TEXT PRIMARY KEY,
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
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trackr_programmes_filters
  ON trackr_programmes (region, industry, season, programme_type);

CREATE TABLE IF NOT EXISTS trackr_sync_meta (
  id TEXT PRIMARY KEY DEFAULT 'default',
  region TEXT,
  industry TEXT,
  season TEXT,
  programme_type TEXT,
  last_synced_at TIMESTAMPTZ,
  programme_count INTEGER
);

INSERT INTO trackr_sync_meta (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE trackr_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trackr_sync_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read trackr programmes" ON trackr_programmes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read trackr sync meta" ON trackr_sync_meta
  FOR SELECT USING (auth.role() = 'authenticated');

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
