-- Simple diagnostic script - should work in any PostgreSQL version
-- Run this in Supabase SQL Editor to check basic connectivity

-- Test 1: Basic connection
SELECT 'Connection test' as test, 'OK' as status;

-- Test 2: Check if profiles table exists
SELECT 
  'Profiles table exists' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'YES' 
    ELSE 'NO' 
  END as status;

-- Test 3: Count profiles
SELECT 
  'Total profiles' as test,
  COUNT(*)::text as status
FROM profiles;

-- Test 4: Check roles
SELECT 
  'Available roles' as test,
  string_agg(role, ', ') as status
FROM (
  SELECT DISTINCT role FROM profiles
) roles;

-- Test 5: Check if addresses table exists
SELECT 
  'Addresses table exists' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses') 
    THEN 'YES' 
    ELSE 'NO' 
  END as status;

-- Test 6: Count addresses
SELECT 
  'Total addresses' as test,
  COUNT(*)::text as status
FROM addresses;
