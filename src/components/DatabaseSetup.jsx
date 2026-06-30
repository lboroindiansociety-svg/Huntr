import { useState } from 'react'
import { Database, Copy, CheckCircle, AlertCircle } from 'lucide-react'

function DatabaseSetup({ onClose }) {
  const [copied, setCopied] = useState(false)

  const sqlSetup = `-- Create the internships table
CREATE TABLE internships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  role TEXT NOT NULL,
  location TEXT CHECK (location IN ('remote', 'on-site', 'hybrid')) DEFAULT 'remote',
  location_place TEXT,
  status TEXT CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected')) DEFAULT 'applied',
  applied_date DATE,
  deadline DATE,
  salary TEXT,
  notes TEXT,
  job_url TEXT,
  tags TEXT[] DEFAULT '{}',
  files JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom statuses table
CREATE TABLE custom_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policies for internships
CREATE POLICY "Users can view own internships" ON internships
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for custom_statuses
CREATE POLICY "Users can view own custom statuses" ON custom_statuses
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for tags
CREATE POLICY "Users can view own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON internships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();`

  const migrationSQL = `-- Migration script for existing databases
-- Add missing columns to existing internships table

-- Add salary column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'internships' AND column_name = 'salary') THEN
    ALTER TABLE internships ADD COLUMN salary TEXT;
  END IF;
END $$;

-- Add files column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'internships' AND column_name = 'files') THEN
    ALTER TABLE internships ADD COLUMN files JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add company_domain column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'internships' AND column_name = 'company_domain') THEN
    ALTER TABLE internships ADD COLUMN company_domain TEXT;
  END IF;
END $$;

-- Add job_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'internships' AND column_name = 'job_url') THEN
    ALTER TABLE internships ADD COLUMN job_url TEXT;
  END IF;
END $$;`

  const trackrMigrationSQL = `-- Trackr Discover: programme cache + dedup column
-- Run this if you use the Discover tab to browse Trackr listings

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trackr_programmes' AND policyname = 'Authenticated users can read trackr programmes'
  ) THEN
    CREATE POLICY "Authenticated users can read trackr programmes" ON trackr_programmes
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trackr_sync_meta' AND policyname = 'Authenticated users can read trackr sync meta'
  ) THEN
    CREATE POLICY "Authenticated users can read trackr sync meta" ON trackr_sync_meta
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

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
  WHERE trackr_id IS NOT NULL;`

  const discoverRolesMigrationSQL = `-- Live roles cache (Adzuna + Reed)
-- Run after Trackr migration if using Discover live roles

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

CREATE TABLE IF NOT EXISTS discover_roles_sync_meta (
  source TEXT PRIMARY KEY CHECK (source IN ('adzuna', 'reed')),
  last_synced_at TIMESTAMPTZ,
  role_count INTEGER
);

ALTER TABLE discover_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discover_roles_sync_meta ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discover_roles' AND policyname = 'Authenticated users can read discover roles'
  ) THEN
    CREATE POLICY "Authenticated users can read discover roles" ON discover_roles
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discover_roles_sync_meta' AND policyname = 'Authenticated users can read discover roles sync meta'
  ) THEN
    CREATE POLICY "Authenticated users can read discover roles sync meta" ON discover_roles_sync_meta
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;`

  const storageSetup = `-- Storage Setup Instructions:
-- 1. Go to your Supabase Dashboard > Storage
-- 2. Create a new bucket called "internship-files" (if not exists)
-- 3. Set it to public (for file downloads)
-- 4. Add the following RLS policies:

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files
CREATE POLICY "Allow upload for authenticated" ON storage.objects 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read files
CREATE POLICY "Allow read for authenticated" ON storage.objects 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their own files
CREATE POLICY "Allow delete for authenticated" ON storage.objects 
FOR DELETE USING (auth.role() = 'authenticated');

-- Allow bucket operations for authenticated users
CREATE POLICY "Allow bucket operations for authenticated" ON storage.buckets
FOR ALL USING (auth.role() = 'authenticated');`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlSetup)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Database Setup Required
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Setup Required
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  To use all features, you need to set up the database tables in your Supabase dashboard.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Steps to set up:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy and paste the SQL code below</li>
                <li>Click "Run" to execute the commands</li>
                <li>Refresh this page when done</li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SQL Setup Code (for new databases)
                </label>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={sqlSetup}
                readOnly
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Migration Script (for existing databases)
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(migrationSQL)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={migrationSQL}
                readOnly
                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trackr Discover Migration (for browsing programme listings)
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trackrMigrationSQL)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={trackrMigrationSQL}
                readOnly
                className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Live Roles Migration (Adzuna + Reed discover section)
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(discoverRolesMigrationSQL)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={discoverRolesMigrationSQL}
                readOnly
                className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage Setup (for file uploads)
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(storageSetup)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={storageSetup}
                readOnly
                className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-primary flex-1"
              >
                I'll set it up later
              </button>
              <button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="btn-secondary flex-1"
              >
                Open Supabase Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseSetup 