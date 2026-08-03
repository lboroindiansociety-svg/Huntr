-- Migrate global Discover cache → per-user cache (append-only going forward)
-- Clears existing shared cache data. Each user re-syncs after running this.
-- Run in Supabase Dashboard → SQL Editor

-- Drop old read-only policies
DROP POLICY IF EXISTS "Authenticated users can read trackr programmes" ON trackr_programmes;
DROP POLICY IF EXISTS "Authenticated users can read trackr sync meta" ON trackr_sync_meta;
DROP POLICY IF EXISTS "Authenticated users can read discover roles" ON discover_roles;
DROP POLICY IF EXISTS "Authenticated users can read discover roles sync meta" ON discover_roles_sync_meta;

-- Clear shared cache (not tied to any user)
TRUNCATE trackr_programmes, trackr_sync_meta, discover_roles, discover_roles_sync_meta;

-- trackr_programmes: add user_id, composite primary key
ALTER TABLE trackr_programmes DROP CONSTRAINT IF EXISTS trackr_programmes_pkey;
ALTER TABLE trackr_programmes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE trackr_programmes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE trackr_programmes ADD PRIMARY KEY (user_id, trackr_id);

DROP INDEX IF EXISTS idx_trackr_programmes_filters;
CREATE INDEX IF NOT EXISTS idx_trackr_programmes_user_filters
  ON trackr_programmes (user_id, region, industry, season, programme_type);

-- trackr_sync_meta: one row per user
ALTER TABLE trackr_sync_meta DROP CONSTRAINT IF EXISTS trackr_sync_meta_pkey;
ALTER TABLE trackr_sync_meta DROP COLUMN IF EXISTS id;
ALTER TABLE trackr_sync_meta ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE trackr_sync_meta ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE trackr_sync_meta ADD PRIMARY KEY (user_id);

-- discover_roles: add user_id, composite primary key
ALTER TABLE discover_roles DROP CONSTRAINT IF EXISTS discover_roles_pkey;
ALTER TABLE discover_roles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE discover_roles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE discover_roles ADD PRIMARY KEY (user_id, source, external_id);

DROP INDEX IF EXISTS idx_discover_roles_synced;
CREATE INDEX IF NOT EXISTS idx_discover_roles_user_synced
  ON discover_roles (user_id, synced_at DESC);

-- discover_roles_sync_meta: per user per source
ALTER TABLE discover_roles_sync_meta DROP CONSTRAINT IF EXISTS discover_roles_sync_meta_pkey;
ALTER TABLE discover_roles_sync_meta ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE discover_roles_sync_meta ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE discover_roles_sync_meta ADD PRIMARY KEY (user_id, source);

-- Per-user RLS (read + write own rows only)
DROP POLICY IF EXISTS "Users manage own trackr programmes" ON trackr_programmes;
DROP POLICY IF EXISTS "Users manage own trackr sync meta" ON trackr_sync_meta;
DROP POLICY IF EXISTS "Users manage own discover roles" ON discover_roles;
DROP POLICY IF EXISTS "Users manage own discover roles sync meta" ON discover_roles_sync_meta;

CREATE POLICY "Users manage own trackr programmes" ON trackr_programmes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own trackr sync meta" ON trackr_sync_meta
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own discover roles" ON discover_roles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own discover roles sync meta" ON discover_roles_sync_meta
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
