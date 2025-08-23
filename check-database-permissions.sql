-- ============================================================================
-- CHECK AND FIX DATABASE PERMISSIONS
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix permission issues

-- Check current permissions on profiles table
SELECT 'Current profiles table permissions:' as test_name;
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Check if the view exists and its permissions
SELECT 'Current collector_dashboard_view status:' as test_name;
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'collector_dashboard_view';

-- Grant permissions to authenticated users
-- This will allow your collector app to access the data
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.collector_dashboard_view TO authenticated;

-- Verify permissions were granted
SELECT 'Permissions after granting SELECT:' as test_name;
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'collector_dashboard_view')
  AND grantee = 'authenticated';

-- Test if we can now read from profiles
SELECT 'Testing profiles access after permission grant:' as test_name;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Test if we can now read from the view
SELECT 'Testing view access after permission grant:' as test_name;
SELECT COUNT(*) as total_pickups FROM public.collector_dashboard_view;
