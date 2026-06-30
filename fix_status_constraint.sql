-- Drop the existing status constraint
ALTER TABLE internships DROP CONSTRAINT IF EXISTS internships_status_check;

-- Add the new status constraint that includes 'saved'
ALTER TABLE internships ADD CONSTRAINT internships_status_check CHECK (
  status = ANY (ARRAY['applied', 'interviewing', 'offer', 'rejected', 'saved'])
);
