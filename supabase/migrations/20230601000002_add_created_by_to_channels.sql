-- Add created_by column to channels table if it doesn't exist
ALTER TABLE channels ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update the RLS policy to include the created_by column
DROP POLICY IF EXISTS "Allow authenticated users to insert channels" ON channels;
CREATE POLICY "Allow authenticated users to insert channels" ON channels
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Ensure RLS is enabled
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

