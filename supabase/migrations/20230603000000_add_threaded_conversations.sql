-- Add parent_id column to messages table
ALTER TABLE messages
ADD COLUMN parent_id UUID REFERENCES messages(id);

-- Update the messages_with_users view to include parent_id
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  messages.*,
  auth.users.email AS user_email
FROM 
  messages
JOIN 
  auth.users ON messages.user_id = auth.users.id;

