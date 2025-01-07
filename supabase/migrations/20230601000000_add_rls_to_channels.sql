-- Enable Row Level Security
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to insert into channels
CREATE POLICY "Allow authenticated users to insert channels" ON channels
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create a policy that allows all users to select from channels
CREATE POLICY "Allow all users to select channels" ON channels
FOR SELECT USING (true);

-- Create a policy that allows the creator to update and delete their own channels
CREATE POLICY "Allow users to update and delete their own channels" ON channels
FOR ALL USING (auth.uid() = created_by);

-- Add created_by column to channels table if it doesn't exist
ALTER TABLE channels ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

