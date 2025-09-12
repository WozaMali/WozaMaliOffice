-- ============================================================================
-- CHECK MATERIALS DATABASE STATUS
-- ============================================================================
-- This script checks what materials are available in the database

-- 1. Check if materials table exists
-- ============================================================================

SELECT 
  'materials' as table_name,
  COUNT(*) as record_count
FROM public.materials
UNION ALL
SELECT 
  'material_categories' as table_name,
  COUNT(*) as record_count
FROM public.material_categories;

-- 2. Check materials table structure
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

-- 3. Show all available materials
-- ============================================================================

SELECT 
  id,
  name,
  category,
  unit,
  rate_per_kg,
  is_active,
  description
FROM public.materials
WHERE is_active = true
ORDER BY name;

-- 4. Show material categories
-- ============================================================================

SELECT 
  id,
  name,
  description,
  icon,
  color
FROM public.material_categories
WHERE active = true
ORDER BY sort_order, name;

-- 5. Check if we need to insert sample materials
-- ============================================================================

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'No materials found - need to insert sample data'
    ELSE 'Materials found: ' || COUNT(*)::text
  END as status
FROM public.materials
WHERE is_active = true;
