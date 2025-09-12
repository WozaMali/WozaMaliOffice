-- ============================================================================
-- CHECK AND POPULATE MATERIALS FROM UNIFIED SCHEMA
-- ============================================================================
-- This script checks existing materials and populates them if needed

-- 1. Check current materials table structure
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'materials'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if materials table has data
-- ============================================================================

SELECT 
  'Materials count:' as info,
  COUNT(*) as total_materials
FROM public.materials;

-- 3. Show existing materials with categories
-- ============================================================================

SELECT 
  m.id,
  m.name,
  c.name as category,
  m.unit_price,
  m.unit,
  m.is_active
FROM public.materials m
LEFT JOIN public.material_categories c ON m.category_id = c.id
ORDER BY c.name, m.name;

-- 4. If no materials exist, populate with basic materials
-- ============================================================================

DO $$
DECLARE
  materials_count INTEGER;
BEGIN
  -- Check if materials table has data
  SELECT COUNT(*) INTO materials_count FROM public.materials;
  
  IF materials_count = 0 THEN
    RAISE NOTICE 'No materials found, populating with basic materials...';
    
    -- Insert basic materials directly (without categories for now)
    INSERT INTO public.materials (name, unit_price, unit, is_active, description) VALUES
      ('Plastic Bottles', 2.50, 'kg', true, 'Clean plastic bottles'),
      ('Paper', 1.80, 'kg', true, 'Clean paper and cardboard'),
      ('Glass Bottles', 1.20, 'kg', true, 'Clean glass bottles'),
      ('Metal Cans', 18.55, 'kg', true, 'Aluminum and steel cans'),
      ('Electronic Waste', 5.00, 'kg', true, 'Small electronic devices'),
      ('Textiles', 1.50, 'kg', true, 'Clothing and fabric'),
      ('Organic Waste', 0.80, 'kg', true, 'Food scraps and garden waste')
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE 'Basic materials inserted successfully!';
  ELSE
    RAISE NOTICE 'Materials already exist: % materials found', materials_count;
  END IF;
END $$;

-- 5. Final check - show all materials
-- ============================================================================

SELECT 
  'Final materials list:' as info,
  COUNT(*) as total_materials
FROM public.materials
WHERE is_active = true;

-- Show all active materials
SELECT 
  name,
  unit_price,
  unit,
  description
FROM public.materials
WHERE is_active = true
ORDER BY name;
