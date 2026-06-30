-- Application rounds / interview stages for each internship
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS application_rounds (
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

CREATE INDEX IF NOT EXISTS idx_application_rounds_internship ON application_rounds(internship_id);
CREATE INDEX IF NOT EXISTS idx_application_rounds_user ON application_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_application_rounds_scheduled ON application_rounds(scheduled_at)
  WHERE scheduled_at IS NOT NULL;

ALTER TABLE application_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own application rounds" ON application_rounds;
CREATE POLICY "Users manage own application rounds" ON application_rounds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_application_rounds_updated_at ON application_rounds;
CREATE TRIGGER update_application_rounds_updated_at
  BEFORE UPDATE ON application_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
