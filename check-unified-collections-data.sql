-- ============================================================================
-- CHECK UNIFIED COLLECTIONS DATA FOR FUND VALUES
-- ============================================================================
-- This script checks if the R15.00 is coming from unified_collections table

-- ============================================================================
-- 1. CHECK TOTAL RECORDS IN UNIFIED_COLLECTIONS
-- ============================================================================

SELECT '=== UNIFIED COLLECTIONS RECORD COUNT ===' as section;
SELECT COUNT(*) as total_records FROM unified_collections;

-- ============================================================================
-- 2. CHECK FOR ANY RECORDS WITH VALUES
-- ============================================================================

SELECT '=== RECORDS WITH VALUES > 0 ===' as section;
SELECT 
    COUNT(*) as records_with_total_value,
    SUM(total_value) as sum_total_value,
    SUM(computed_value) as sum_computed_value
FROM unified_collections
WHERE total_value > 0 OR computed_value > 0;

-- ============================================================================
-- 3. SHOW ACTUAL RECORDS WITH VALUES
-- ============================================================================

SELECT '=== ACTUAL RECORDS WITH VALUES ===' as section;
SELECT 
    id,
    collection_code,
    customer_name,
    total_value,
    computed_value,
    status,
    created_at
FROM unified_collections
WHERE total_value > 0 OR computed_value > 0
ORDER BY created_at DESC;

-- ============================================================================
-- 4. CHECK FOR PET-RELATED COLLECTIONS
-- ============================================================================

SELECT '=== PET-RELATED COLLECTIONS ===' as section;
SELECT 
    id,
    collection_code,
    customer_name,
    total_value,
    computed_value,
    status,
    created_at
FROM unified_collections
WHERE collection_code ILIKE '%PET%' 
   OR customer_name ILIKE '%PET%'
   OR total_value > 0
ORDER BY created_at DESC;

-- ============================================================================
-- 5. CHECK COLLECTION MATERIALS TABLE
-- ============================================================================

SELECT '=== COLLECTION MATERIALS TABLE ===' as section;
SELECT 
    'Collection materials table exists:' as info,
    CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collection_materials') 
         THEN 'YES' 
         ELSE 'NO' 
    END as exists;

-- If collection_materials exists, show its structure
SELECT 
    'Collection materials columns:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'collection_materials'
ORDER BY column_name;

-- ============================================================================
-- 6. CHECK FOR ANY FUND-RELATED DATA IN COLLECTION MATERIALS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collection_materials') THEN
        RAISE NOTICE 'Checking collection_materials table data...';
    ELSE
        RAISE NOTICE 'Collection materials table does not exist';
    END IF;
END $$;
