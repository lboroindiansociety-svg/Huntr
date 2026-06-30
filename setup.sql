-- Internship Tracker — full database setup for a new Supabase project
-- Run this entire script in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Tables ───────────────────────────────────────────────────────────────

CREATE TABLE internships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT CHECK (location IN ('remote', 'on-site', 'hybrid')) DEFAULT 'remote',
  location_place TEXT,
  status TEXT CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'saved')) DEFAULT 'applied',
  applied_date DATE,
  deadline DATE,
  salary TEXT,
  notes TEXT,
  saved_notes TEXT,
  saved_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT[] DEFAULT '{}',
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE custom_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round_type TEXT NOT NULL DEFAULT 'other' CHECK (
    round_type IN ('application', 'oa', 'phone', 'technical', 'behavioral', 'onsite', 'final', 'other')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'scheduled', 'completed', 'passed', 'failed', 'skipped')
  ),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_rounds_internship ON application_rounds(internship_id);
CREATE INDEX idx_application_rounds_user ON application_rounds(user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own internships" ON internships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own custom statuses" ON custom_statuses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own application rounds" ON application_rounds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── updated_at trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON internships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_rounds_updated_at
  BEFORE UPDATE ON application_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage (file uploads) is configured separately — see setup-storage.md
