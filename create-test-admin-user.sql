-- ============================================================================
-- CREATE TEST ADMIN USER
-- ============================================================================
-- Run this in your Supabase SQL Editor to create a test admin user
-- This will allow you to test the new real authentication system

-- First, create a user in Supabase Auth (you'll need to do this manually in the Auth section)
-- Go to Authentication > Users > Add User
-- Email: admin@wozamali.com
-- Password: admin123456
-- Set email confirmed to true

-- Then run this SQL to create the profile:

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  -- Replace this UUID with the actual user ID from Supabase Auth
  -- You can find this in Authentication > Users after creating the user
  '00000000-0000-0000-0000-000000000000', -- REPLACE WITH ACTUAL USER ID
  
  'admin@wozamali.com',
  'System Administrator',
  'ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the user was created
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.profiles 
WHERE email = 'admin@wozamali.com';

-- ============================================================================
-- ALTERNATIVE: Create user via Supabase Auth API
-- ============================================================================
-- If you prefer to create the user programmatically, you can use this:

-- 1. Go to your Supabase project dashboard
-- 2. Go to Authentication > Users
-- 3. Click "Add User"
-- 4. Fill in:
--    - Email: admin@wozamali.com
--    - Password: admin123456
--    - Email confirmed: ✓ (checked)
-- 5. Click "Create User"
-- 6. Copy the User ID from the created user
-- 7. Replace the UUID in the INSERT statement above with the actual User ID

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
-- Email: admin@wozamali.com
-- Password: admin123456
-- Role: ADMIN
-- Access: Full admin dashboard with real-time data

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Create the user in Supabase Auth
-- 2. Run this SQL script with the correct User ID
-- 3. Test login with the credentials above
-- 4. Your dashboard should now show real-time data!
