-- Check and fix role inconsistencies in the profiles table
-- This script will identify and correct any uppercase roles that don't match the schema

-- First, let's see what roles currently exist in the database
SELECT 'Current roles in database:' as info;
SELECT role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- Check if there are any profiles with uppercase roles
SELECT 'Profiles with uppercase roles:' as info;
SELECT id, email, full_name, role, is_active
FROM profiles 
WHERE role IN ('CUSTOMER', 'COLLECTOR', 'ADMIN', 'STAFF')
ORDER BY role;

-- Check if there are any profiles with lowercase roles
SELECT 'Profiles with lowercase roles:' as info;
SELECT id, email, full_name, role, is_active
FROM profiles 
WHERE role IN ('customer', 'collector', 'admin')
ORDER BY role;

-- Fix any uppercase roles to lowercase to match the schema
-- This will ensure the role constraint check (role in ('customer','collector','admin')) passes
UPDATE profiles 
SET role = LOWER(role)
WHERE role IN ('CUSTOMER', 'COLLECTOR', 'ADMIN', 'STAFF');

-- Show the results after fixing
SELECT 'Roles after fixing (should all be lowercase):' as info;
SELECT role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- Verify that all profiles now have valid roles
SELECT 'Verification - all profiles should have valid roles:' as info;
SELECT 
  CASE 
    WHEN role IN ('customer', 'collector', 'admin') THEN '✅ Valid'
    ELSE '❌ Invalid: ' || role
  END as status,
  COUNT(*) as count
FROM profiles 
GROUP BY 
  CASE 
    WHEN role IN ('customer', 'collector', 'admin') THEN '✅ Valid'
    ELSE '❌ Invalid: ' || role
  END;
