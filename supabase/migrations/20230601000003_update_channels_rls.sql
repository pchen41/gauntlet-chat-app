-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert channels" ON channels;
DROP POLICY IF EXISTS "Allow all users to select channels" ON channels;

-- Create a policy that allows authenticated users to insert into channels
CREATE POLICY "Allow authenticated users to insert channels" ON channels
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create a policy that allows users to select public channels and channels they've created
CREATE POLICY "Allow users to select public channels and own channels" ON channels
FOR SELECT USING (
  type = 'public' OR auth.uid() = created_by
);

-- Ensure RLS is enabled
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

