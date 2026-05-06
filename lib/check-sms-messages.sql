-- Check recent SMS messages sent
-- Run this in Supabase SQL Editor to see what happened

-- Check the last 10 messages in the queue
SELECT 
  id,
  phone_number,
  message_text,
  message_type,
  status,
  error_message,
  sent_at,
  created_at
FROM message_queue
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any failed messages
SELECT 
  COUNT(*) as failed_count,
  error_message
FROM message_queue
WHERE status = 'failed'
GROUP BY error_message
ORDER BY failed_count DESC;

-- Check Celcom API balance (if you have access)
-- You can also check this by visiting: https://isms.celcomafrica.com/
