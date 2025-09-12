-- ============================================================================
-- CHECK EXISTING MATERIALS IN UNIFIED TABLES - CORRECT COLUMNS
-- ============================================================================
-- This script checks what materials already exist in the unified schema

-- 1. Check all materials-related tables
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename LIKE '%material%'
AND schemaname = 'public'
ORDER BY tablename;

-- 2. Check materials table structure and data
-- ============================================================================

-- Check if materials table exists and show structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show existing materials data
-- ============================================================================

SELECT 
  'Current materials in database:' as info,
  COUNT(*) as total_materials
FROM public.materials;

-- Show sample materials with category names (using correct column names)
SELECT 
  m.id,
  m.name,
  c.name as category,
  m.rate_per_kg,
  m.unit,
  m.is_active,
  m.description
FROM public.materials m
LEFT JOIN public.material_categories c ON m.category_id = c.id
ORDER BY c.name, m.name
LIMIT 10;

-- 4. Check if there are material categories
-- ============================================================================

SELECT 
  'Material categories table:' as info,
  COUNT(*) as total_categories
FROM public.material_categories;

-- Show categories if they exist
SELECT 
  id,
  name,
  description,
  icon,
  color
FROM public.material_categories
ORDER BY sort_order, name;

-- 5. Check which schema is being used
-- ============================================================================

-- Check if it's the simple schema (category as text) or complex schema (category_id)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'category' AND table_schema = 'public') 
    THEN 'Simple schema (category as text)'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'category_id' AND table_schema = 'public')
    THEN 'Complex schema (category_id foreign key)'
    ELSE 'Unknown schema'
  END as schema_type;

-- 6. Show pricing information
-- ============================================================================

SELECT 
  'Pricing column:' as info,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'materials'
AND table_schema = 'public'
AND (column_name LIKE '%price%' OR column_name LIKE '%rate%');

-- 7. Final summary
-- ============================================================================

SELECT 
  'Materials check completed!' as status,
  (SELECT COUNT(*) FROM public.materials) as total_materials,
  (SELECT COUNT(*) FROM public.material_categories) as total_categories;
