-- Add foreign key constraint to messages table
ALTER TABLE messages
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES auth.users(id);

-- Create a view that joins messages with user emails
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  messages.*,
  auth.users.email AS user_email
FROM 
  messages
JOIN 
  auth.users ON messages.user_id = auth.users.id;

