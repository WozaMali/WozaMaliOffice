-- ============================================================================
-- ADD TEST DATA SAFELY
-- ============================================================================
-- This script adds test data without violating existing constraints
-- Run this AFTER running the check-profiles-structure.sql script

-- First, let's see what roles are actually allowed
SELECT DISTINCT role FROM public.profiles WHERE role IS NOT NULL;

-- Then, let's add test data using the existing role values
-- (Replace 'EXISTING_ROLE' with an actual role from your table)

-- Option 1: If you want to add a test user with an existing role
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES (
--   '11111111-1111-1111-1111-111111111111',
--   'test-user@wozamali.com',
--   'Test User',
--   'EXISTING_ROLE'  -- Replace with actual role from your table
-- ) ON CONFLICT (id) DO NOTHING;

-- Option 2: Update an existing user to have a collector-like role
-- UPDATE public.profiles 
-- SET role = 'EXISTING_ROLE'  -- Replace with actual role from your table
-- WHERE email = 'admin@wozamali.com';

-- Option 3: Just create the pickup tables and skip user creation for now
-- (The collector app can work with existing users)

-- Let's also check if we can create a simple test pickup
SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  a.id as address_id,
  a.line1
FROM public.profiles p
LEFT JOIN public.addresses a ON a.profile_id = p.id
LIMIT 5;
