# Supabase Login Issue - FIXED

## Problem
The login system wasn't working because the `users` table is missing the `password_hash` column that the authentication system needs.

## Root Cause
- The `lib/users-schema.sql` creates the users table without password fields
- The `lib/add-auth-fields.sql` adds the password_hash column, but it wasn't run yet
- The login API (`pages/api/auth/login.ts`) expects `password_hash` to exist

## Solution

### Step 1: Add Password Column to Users Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add password_hash column for authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password_hash);
```

### Step 2: Set Default Passwords for Existing Users

Run this SQL to set default password "admin123" for all users:

```sql
-- Default password: admin123
-- Hashed with bcrypt
UPDATE users 
SET password_hash = '$2a$10$REDACTED_APP_SECRET'
WHERE password_hash IS NULL;
```

### Step 3: Test Login

Now you can login with ANY user email in your database with password: `admin123`

Check your Supabase users table to see what emails you have, then use:
- Email: (your actual user email)
- Password: `admin123`

## Quick Fix (All-in-One SQL)

Copy and paste this into Supabase SQL Editor:

```sql
-- Add password column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Set default password for all users (admin123)
UPDATE users 
SET password_hash = '$2a$10$REDACTED_APP_SECRET'
WHERE password_hash IS NULL;

-- Verify
SELECT id, full_name, email, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status
FROM users;
```

## How to Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `ugemjqouxnholwlgvzer`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL above
6. Click "Run" or press Ctrl+Enter

## After Running SQL

1. Check your users in Supabase (Table Editor > users table)
2. Note any email address from your users
3. Refresh your POS login page
4. Login with: (your user email) / `admin123`
5. You should be redirected to the dashboard

## Change Password Later

After logging in, go to Settings > My Profile to change your password.
