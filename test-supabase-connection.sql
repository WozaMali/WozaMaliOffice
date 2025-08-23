-- ============================================================================
-- TEST SUPABASE CONNECTION AND DATA
-- ============================================================================
-- Run this in your Supabase SQL Editor to debug the connection issues

-- Test 1: Check if profiles table has data
SELECT 'Profiles Test:' as test_name;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'member' THEN 1 END) as member_users,
  COUNT(CASE WHEN role = 'collector' THEN 1 END) as collector_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
FROM public.profiles;

-- Test 2: Check if collector_dashboard_view exists and has data
SELECT 'Dashboard View Test:' as test_name;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE view_name = 'collector_dashboard_view') 
    THEN 'View exists' 
    ELSE 'View does not exist' 
  END as view_status;

-- If view exists, check its data
SELECT 'Dashboard View Data:' as test_name;
SELECT COUNT(*) as total_rows FROM public.collector_dashboard_view;

-- Test 3: Check if pickups table has data
SELECT 'Pickups Test:' as test_name;
SELECT 
  COUNT(*) as total_pickups,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_pickups,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_pickups,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_pickups
FROM public.pickups;

-- Test 4: Check if materials table has data
SELECT 'Materials Test:' as test_name;
SELECT 
  COUNT(*) as total_materials,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_materials
FROM public.materials;

-- Test 5: Check if addresses table has data
SELECT 'Addresses Test:' as test_name;
SELECT 
  COUNT(*) as total_addresses,
  COUNT(CASE WHEN profile_id IS NOT NULL THEN 1 END) as linked_addresses
FROM public.addresses;

-- Test 6: Check RLS policies
SELECT 'RLS Policy Test:' as test_name;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'pickups', 'materials', 'addresses')
ORDER BY tablename, policyname;
