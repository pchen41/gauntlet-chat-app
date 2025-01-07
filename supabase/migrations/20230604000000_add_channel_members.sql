-- Create channel_members table
CREATE TABLE channel_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS on channel_members table
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own channel memberships
CREATE POLICY "Users can view their own channel memberships" ON channel_members
FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to join public channels
CREATE POLICY "Users can join public channels" ON channel_members
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT type FROM channels WHERE id = channel_id) = 'public'
  AND auth.uid() = user_id
);

-- Create policy to allow users to leave channels
CREATE POLICY "Users can leave channels" ON channel_members
FOR DELETE USING (auth.uid() = user_id);

-- Update channels table policies
DROP POLICY IF EXISTS "Allow all users to select channels" ON channels;
CREATE POLICY "Users can view public channels and channels they're members of" ON channels
FOR SELECT USING (
  type = 'public' OR
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = channels.id
    AND channel_members.user_id = auth.uid()
  )
);

-- Update messages table policies
DROP POLICY IF EXISTS "Allow all users to select messages" ON messages;
CREATE POLICY "Users can view messages in channels they're members of" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = messages.channel_id
    AND channel_members.user_id = auth.uid()
  )
);

-- Update messages insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
CREATE POLICY "Allow channel members to insert messages" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = messages.channel_id
    AND channel_members.user_id = auth.uid()
  )
);

-- Add the creator as a member when a channel is created
CREATE OR REPLACE FUNCTION add_channel_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channel_members (channel_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_channel_creator_as_member_trigger
AFTER INSERT ON channels
FOR EACH ROW
EXECUTE FUNCTION add_channel_creator_as_member();

