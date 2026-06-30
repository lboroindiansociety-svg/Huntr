# Database Setup Instructions

## Issue
You're seeing a 404 error when trying to access the `custom_statuses` table in Supabase. This happens because the required database tables haven't been created yet.

## Solution

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (usually in the left sidebar)

### Step 2: Run the Database Setup
1. Copy the SQL code from the Database Setup modal in your app
2. Paste it into the SQL Editor in Supabase
3. Click "Run" to execute the commands

### Step 3: Verify Tables Created
After running the SQL, you should see these tables created:
- `internships` - for storing internship applications
- `custom_statuses` - for storing custom application stages
- `tags` - for storing custom tags

### Step 4: Refresh Your App
Once the tables are created, refresh your application and the 404 errors should be resolved.

## What the SQL Setup Does

The setup script:
1. Creates the necessary tables with proper relationships
2. Enables Row Level Security (RLS) for data protection
3. Creates policies to ensure users can only access their own data
4. Sets up triggers for automatic timestamp updates

## Troubleshooting

If you still see errors after running the setup:
1. Check that all tables were created successfully in the Supabase dashboard
2. Verify that Row Level Security is enabled on all tables
3. Ensure the policies were created correctly
4. Try refreshing your application

## Manual Table Creation

If the automatic setup doesn't work, you can manually create the tables:

```sql
-- Create custom statuses table
CREATE TABLE custom_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own custom statuses" ON custom_statuses
  FOR ALL USING (auth.uid() = user_id);
```

This should resolve the 404 error you're experiencing. 