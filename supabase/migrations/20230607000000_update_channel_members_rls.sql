-- Update channel_members RLS policies
DROP POLICY IF EXISTS "Users can join public channels" ON channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON channel_members;

-- Allow users to join public channels or channels they've created
CREATE POLICY "Users can join public channels or own channels" ON channel_members
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT type FROM channels WHERE id = channel_members.channel_id) = 'public'
  OR
  (SELECT created_by FROM channels WHERE id = channel_members.channel_id) = auth.uid()
);

-- Allow users to leave channels they're members of
CREATE POLICY "Users can leave channels" ON channel_members
FOR DELETE USING (auth.uid() = user_id);

-- Create a function to create a channel and add the creator as a member
CREATE OR REPLACE FUNCTION create_channel_and_add_member(
  channel_name TEXT,
  channel_type TEXT,
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_channel_id UUID;
BEGIN
  -- Insert the new channel
  INSERT INTO channels (name, type, created_by)
  VALUES (channel_name, channel_type, user_id)
  RETURNING channels.id INTO new_channel_id;

  -- Add the creator as a member, ignoring if they're already a member
  INSERT INTO channel_members (channel_id, user_id)
  VALUES (new_channel_id, user_id)
  ON CONFLICT (channel_id, user_id) DO NOTHING;

  -- Return the new channel details
  RETURN QUERY
  SELECT channels.id, channels.name, channels.type, channels.created_by
  FROM channels
  WHERE channels.id = new_channel_id;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_channel_and_add_member(TEXT, TEXT, UUID) TO authenticated;

