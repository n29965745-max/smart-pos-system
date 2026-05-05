-- Check if there are ANY users in the database
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- If no users exist, you need to create one!
