-- Live grad role listings from Adzuna + Reed
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS discover_roles (
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
  PRIMARY KEY (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_discover_roles_synced ON discover_roles (synced_at DESC);

CREATE TABLE IF NOT EXISTS discover_roles_sync_meta (
  source TEXT PRIMARY KEY CHECK (source IN ('adzuna', 'reed')),
  last_synced_at TIMESTAMPTZ,
  role_count INTEGER
);

ALTER TABLE discover_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discover_roles_sync_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read discover roles" ON discover_roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read discover roles sync meta" ON discover_roles_sync_meta
  FOR SELECT USING (auth.role() = 'authenticated');
