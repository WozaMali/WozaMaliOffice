-- ============================================================================
-- CHECK PICKUP ITEMS TABLE STRUCTURE
-- ============================================================================
-- This script checks if the pickup_items table exists and its structure

-- ============================================================================
-- STEP 1: CHECK IF PICKUP_ITEMS TABLE EXISTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking if pickup_items table exists...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_items' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ pickup_items table exists';
    ELSE
        RAISE NOTICE '❌ pickup_items table does not exist';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: SHOW PICKUP_ITEMS TABLE STRUCTURE
-- ============================================================================

-- Show the structure of pickup_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Show foreign key constraints on pickup_items table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'pickup_items'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- STEP 4: CHECK IF MATERIALS TABLE EXISTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Checking if materials table exists...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ materials table exists';
    ELSE
        RAISE NOTICE '❌ materials table does not exist';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: SHOW SAMPLE DATA
-- ============================================================================

-- Show sample data from pickup_items table (if any)
SELECT 
    'Sample pickup_items data:' as info,
    COUNT(*) as total_records
FROM public.pickup_items;

-- Show sample data from materials table (if any)
SELECT 
    'Sample materials data:' as info,
    COUNT(*) as total_records
FROM public.materials;
