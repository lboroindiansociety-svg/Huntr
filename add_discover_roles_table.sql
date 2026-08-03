-- Live grad role listings from Adzuna + Reed (per user)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS discover_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('adzuna', 'reed')),
  company_name TEXT NOT NULL,
  company_domain TEXT,
  role TEXT NOT NULL,
  job_url TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  description TEXT,
  posted_at TIMESTAMPTZ,
  search_query TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_discover_roles_user_synced
  ON discover_roles (user_id, synced_at DESC);

CREATE TABLE IF NOT EXISTS discover_roles_sync_meta (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('adzuna', 'reed')),
  last_synced_at TIMESTAMPTZ,
  role_count INTEGER,
  PRIMARY KEY (user_id, source)
);

ALTER TABLE discover_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discover_roles_sync_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own discover roles" ON discover_roles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own discover roles sync meta" ON discover_roles_sync_meta
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
