-- ============================================================================
-- CHECK EXACT MATERIALS TABLE STRUCTURE
-- ============================================================================
-- This script shows the exact column names in the materials table

-- 1. Show all columns in materials table
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show sample data to see actual column names
-- ============================================================================

SELECT *
FROM public.materials
LIMIT 3;

-- 3. Check if table exists and has data
-- ============================================================================

SELECT 
  'Materials table status:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials' AND table_schema = 'public')
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as table_exists,
  (SELECT COUNT(*) FROM public.materials) as total_records;
