-- Drop the existing function
DROP FUNCTION IF EXISTS create_channel_and_add_member(TEXT, TEXT, UUID);

-- Create an updated function to create a channel and add the creator as a member
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

  -- Add the creator as a member
  BEGIN
    INSERT INTO channel_members (channel_id, user_id)
    VALUES (new_channel_id, user_id);
  EXCEPTION
    WHEN unique_violation THEN
      -- If the user is already a member, just continue
      NULL;
  END;

  -- Return the new channel details
  RETURN QUERY
  SELECT channels.id, channels.name, channels.type, channels.created_by
  FROM channels
  WHERE channels.id = new_channel_id;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_channel_and_add_member(TEXT, TEXT, UUID) TO authenticated;

