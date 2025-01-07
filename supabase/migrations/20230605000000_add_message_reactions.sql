-- Create the message_reactions table
CREATE TABLE message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions table
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to add reactions
CREATE POLICY "Users can add reactions" ON message_reactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON message_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow all users to view reactions
CREATE POLICY "All users can view reactions" ON message_reactions
FOR SELECT USING (true);

