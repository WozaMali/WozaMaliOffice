-- ============================================================================
-- CHECK COLLECTION MATERIALS DATA FOR FUND VALUES
-- ============================================================================
-- This script checks if the R15.00 is coming from collection_materials table

-- ============================================================================
-- 1. CHECK TOTAL RECORDS IN COLLECTION_MATERIALS
-- ============================================================================

SELECT '=== COLLECTION MATERIALS RECORD COUNT ===' as section;
SELECT COUNT(*) as total_records FROM collection_materials;

-- ============================================================================
-- 2. CHECK FOR ANY RECORDS WITH VALUES
-- ============================================================================

SELECT '=== RECORDS WITH VALUES > 0 ===' as section;
SELECT 
    COUNT(*) as records_with_total_price,
    SUM(total_price) as sum_total_price,
    SUM(quantity) as sum_quantity
FROM collection_materials
WHERE total_price > 0 OR quantity > 0;

-- ============================================================================
-- 3. SHOW ACTUAL RECORDS WITH VALUES
-- ============================================================================

SELECT '=== ACTUAL RECORDS WITH VALUES ===' as section;
SELECT 
    id,
    collection_id,
    material_id,
    quantity,
    unit_price,
    total_price,
    points_earned,
    created_at
FROM collection_materials
WHERE total_price > 0 OR quantity > 0
ORDER BY created_at DESC;

-- ============================================================================
-- 4. CHECK UNIFIED COLLECTIONS DATA
-- ============================================================================

SELECT '=== UNIFIED COLLECTIONS DATA ===' as section;
SELECT 
    COUNT(*) as total_records,
    SUM(total_value) as sum_total_value,
    SUM(computed_value) as sum_computed_value
FROM unified_collections
WHERE total_value > 0 OR computed_value > 0;

-- ============================================================================
-- 5. SHOW UNIFIED COLLECTIONS WITH VALUES
-- ============================================================================

SELECT '=== UNIFIED COLLECTIONS WITH VALUES ===' as section;
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
-- 6. CHECK FOR PET-RELATED MATERIALS
-- ============================================================================

SELECT '=== PET-RELATED MATERIALS ===' as section;
SELECT 
    cm.id,
    cm.collection_id,
    cm.material_id,
    cm.quantity,
    cm.total_price,
    cm.created_at
FROM collection_materials cm
WHERE cm.total_price > 0
ORDER BY cm.created_at DESC;

-- ============================================================================
-- 7. SUMMARY OF ALL FUND DATA
-- ============================================================================

SELECT '=== SUMMARY OF ALL FUND DATA ===' as section;
SELECT 
    'Collection Materials Total Price:' as source,
    COALESCE(SUM(total_price), 0) as total_amount
FROM collection_materials
WHERE total_price > 0
UNION ALL
SELECT 
    'Unified Collections Total Value:' as source,
    COALESCE(SUM(total_value), 0) as total_amount
FROM unified_collections
WHERE total_value > 0
UNION ALL
SELECT 
    'Unified Collections Computed Value:' as source,
    COALESCE(SUM(computed_value), 0) as total_amount
FROM unified_collections
WHERE computed_value > 0;
