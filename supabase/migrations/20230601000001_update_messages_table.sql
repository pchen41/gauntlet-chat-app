-- Remove user_email column if it exists
ALTER TABLE messages DROP COLUMN IF EXISTS user_email;

-- Add user_id column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to insert messages
CREATE POLICY "Allow authenticated users to insert messages" ON messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows all users to select messages
CREATE POLICY "Allow all users to select messages" ON messages
FOR SELECT USING (true);

