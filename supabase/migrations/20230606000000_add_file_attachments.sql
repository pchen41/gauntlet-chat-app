-- Add file_url and file_name columns to messages table
ALTER TABLE messages
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT;

-- Update the messages_with_users view to include file_url and file_name
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  messages.*,
  auth.users.email AS user_email
FROM 
  messages
JOIN 
  auth.users ON messages.user_id = auth.users.id;

