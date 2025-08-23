-- ============================================================================
-- CHECK EXISTING PROFILES TABLE STRUCTURE
-- ============================================================================
-- Run this in your Supabase SQL Editor to see what we're working with

-- Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the role column constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND contype = 'c';

-- Check what roles currently exist
SELECT DISTINCT role FROM public.profiles WHERE role IS NOT NULL;

-- Check a sample profile to see the actual structure
SELECT * FROM public.profiles LIMIT 1;
