-- ============================================================================
-- CHECK PROFILES TABLE RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor to see what's blocking access

-- Check current RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- Check if there are any policies that allow SELECT for authenticated users
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
  AND cmd = 'SELECT';

-- Check the current user context
SELECT 
  current_user,
  current_setting('role'),
  current_setting('request.jwt.claims', true)::json->>'role' as jwt_role,
  current_setting('request.jwt.claims', true)::json->>'sub' as jwt_sub;

-- Test a simple query as the current user
SELECT 'Testing profiles access:' as test_name;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check if there's a policy that allows authenticated users to read profiles
SELECT 
  'Missing SELECT policy for authenticated users' as issue
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND cmd = 'SELECT'
    AND (roles = '{authenticated}' OR roles = '{anon}')
);
