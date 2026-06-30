# Database Migration Guide

## Issue
If internships aren't being added after implementing the tag system, it's likely because your existing `internships` table doesn't have the `tags` column.

## Solution

### Step 1: Check Current Table Structure
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Check if the `internships` table has a `tags` column

### Step 2: Add Tags Column (if missing)
If the `tags` column is missing, run this SQL in your Supabase SQL Editor:

```sql
-- Add tags column to existing internships table
ALTER TABLE internships 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update existing rows to have empty tags array
UPDATE internships 
SET tags = '{}' 
WHERE tags IS NULL;
```

### Step 3: Add Location Place Column
If you're getting errors about the `location_place` column, run this SQL:

```sql
-- Add location_place column to existing internships table
ALTER TABLE internships 
ADD COLUMN IF NOT EXISTS location_place TEXT;

-- Update existing rows to have empty location_place
UPDATE internships 
SET location_place = '' 
WHERE location_place IS NULL;
```

### Step 4: Verify the Update
After running the migration, check that:
1. The `tags` column exists in the `internships` table
2. All existing internships have an empty tags array `{}`
3. The `location_place` column exists in the `internships` table
4. All existing internships have an empty location_place string `''`

### Step 5: Test Adding Internships
Try adding a new internship with tags and location place to verify the fix works.

## Alternative: Recreate Tables
If the migration doesn't work, you can:

1. **Backup your data** (export from Supabase dashboard)
2. **Drop existing tables**:
   ```sql
   DROP TABLE IF EXISTS internships CASCADE;
   DROP TABLE IF EXISTS custom_statuses CASCADE;
   DROP TABLE IF EXISTS tags CASCADE;
   ```
3. **Run the full setup** from the DatabaseSetup modal in your app

## Troubleshooting

### Common Errors:
- **Column already exists**: The migration will skip adding the column if it already exists
- **Permission denied**: Make sure you're using the correct database role
- **Data type mismatch**: The tags column should be `TEXT[]` (array of text)
- **location_place column not found**: Run the location_place migration above

### Verify Setup:
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'internships';

-- Check if tags column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'internships' AND column_name = 'tags';

-- Check if location_place column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'internships' AND column_name = 'location_place';
```

This should resolve the issue with adding internships when tags are included. 