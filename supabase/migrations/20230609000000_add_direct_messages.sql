-- Add 'direct' type to channels table
ALTER TABLE channels
ALTER COLUMN type TYPE TEXT,
ALTER COLUMN type SET DEFAULT 'public';

-- Update the check constraint for the type column
ALTER TABLE channels
DROP CONSTRAINT IF EXISTS channels_type_check,
ADD CONSTRAINT channels_type_check
CHECK (type IN ('public', 'private', 'direct'));

-- Add 'hidden' column to channel_members table
ALTER TABLE channel_members
ADD COLUMN hidden BOOLEAN DEFAULT FALSE;

-- Create a function to get or create a direct message channel
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(user_ids UUID[], current_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  result_channel_id UUID;
BEGIN
  -- Try to find an existing direct message channel with the same users
  SELECT c.id INTO result_channel_id
  FROM channels c
  JOIN channel_members cm ON c.id = cm.channel_id
  WHERE c.type = 'direct'
  GROUP BY c.id
  HAVING 
      array_agg(cm.user_id ORDER BY cm.user_id) = (SELECT array_agg(u ORDER BY u) FROM unnest(user_ids) u)
      AND count(*) = array_length(user_ids, 1);

  -- If no existing channel found, create a new one
  IF result_channel_id IS NULL THEN
      INSERT INTO channels (type, name, created_by)
      VALUES ('direct', 'Direct Message', current_user_id)
      RETURNING id INTO result_channel_id;

      -- Add all users to the new channel, ignoring duplicates
      INSERT INTO channel_members (channel_id, user_id)
      SELECT result_channel_id, unnest(user_ids)
      ON CONFLICT DO NOTHING;
  ELSE
      UPDATE channel_members mem SET hidden=false
      WHERE mem.user_id=current_user_id AND mem.channel_id=result_channel_id;
  END IF;

  RETURN result_channel_id;
END;
$$;

-- Update the channels RLS policies to include direct messages
DROP POLICY IF EXISTS "Users can view public channels and channels they're members of" ON channels;
CREATE POLICY "Users can view their channels" ON channels
FOR SELECT USING (
    type = 'public' OR
    EXISTS (
        SELECT 1 FROM channel_members
        WHERE channel_members.channel_id = channels.id
        AND channel_members.user_id = auth.uid()
    )
);

-- Update the messages RLS policies to include direct messages
DROP POLICY IF EXISTS "Users can view messages in channels they're members of" ON messages;
CREATE POLICY "Users can view messages in their channels" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM channel_members
        WHERE channel_members.channel_id = messages.channel_id
        AND channel_members.user_id = auth.uid()
    )
);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_dm_channel(UUID[], UUID) TO authenticated;

