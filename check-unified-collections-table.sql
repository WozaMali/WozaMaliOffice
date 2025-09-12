-- ============================================================================
-- CHECK UNIFIED_COLLECTIONS TABLE STATUS
-- ============================================================================
-- This script checks if the unified_collections table exists and its structure
-- Run this in your Supabase SQL Editor

-- 1. Check if unified_collections table exists
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'unified_collections'
AND schemaname = 'public';

-- 2. Check table structure if it exists
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'unified_collections'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
-- ============================================================================

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'unified_collections'
AND tc.table_schema = 'public';

-- 4. Check if table has any data
-- ============================================================================

SELECT COUNT(*) as record_count
FROM public.unified_collections;

-- 5. Check what tables actually exist
-- ============================================================================

SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename LIKE '%collection%'
ORDER BY tablename;

-- 6. Check user_profiles table structure
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check if the specific collector ID exists in user_profiles
-- ============================================================================

SELECT 
  id,
  email,
  full_name,
  role,
  status
FROM public.user_profiles 
WHERE id = '90341fc7-d088-4824-9a1f-c2870d1486e1';

-- 8. Success message
-- ============================================================================

SELECT 'Table check completed successfully!' as status;
