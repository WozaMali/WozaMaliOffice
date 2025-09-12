-- ============================================================================
-- CHECK MATERIALS TABLE - FINAL VERSION
-- ============================================================================
-- This script checks the materials table with the correct schema

-- 1. Show materials table structure
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

-- 2. Show existing materials data
-- ============================================================================

SELECT 
  'Current materials in database:' as info,
  COUNT(*) as total_materials
FROM public.materials;

-- Show all materials with their details
SELECT 
  id,
  name,
  category,
  rate_per_kg,
  unit,
  is_active,
  description
FROM public.materials
ORDER BY category, name;

-- 3. Show materials by category
-- ============================================================================

SELECT 
  category,
  COUNT(*) as material_count,
  AVG(rate_per_kg) as avg_price
FROM public.materials
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 4. Final summary
-- ============================================================================

SELECT 
  'Materials check completed!' as status,
  (SELECT COUNT(*) FROM public.materials WHERE is_active = true) as active_materials,
  (SELECT COUNT(DISTINCT category) FROM public.materials WHERE is_active = true) as categories;
