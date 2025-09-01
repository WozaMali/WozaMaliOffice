-- ============================================================================
-- CHECK PICKUP ITEMS TABLE
-- ============================================================================
-- This script checks why total_kg and total_value are 0

-- Step 1: Check if pickup_items table exists and has data
SELECT 'CHECKING PICKUP_ITEMS TABLE' as check_type;
SELECT 
    'pickup_items' as table_name,
    (SELECT COUNT(*) FROM pickup_items) as record_count;

-- Step 2: Check pickup_items table structure
SELECT 'PICKUP_ITEMS TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'pickup_items'
ORDER BY ordinal_position;

-- Step 3: Check if there are any pickup_items records
SELECT 'CHECKING FOR PICKUP ITEMS DATA' as check_type;
SELECT 
    'Total pickup_items' as metric,
    COUNT(*) as count
FROM pickup_items
UNION ALL
SELECT 
    'Pickups with items' as metric,
    COUNT(DISTINCT pickup_id) as count
FROM pickup_items
UNION ALL
SELECT 
    'Materials referenced' as metric,
    COUNT(DISTINCT material_id) as count
FROM pickup_items;

-- Step 4: Show sample pickup_items if they exist
SELECT 'SAMPLE PICKUP ITEMS (if any)' as check_type;
SELECT 
    pi.id,
    pi.pickup_id,
    pi.material_id,
    pi.kilograms,
    pi.contamination_pct,
    m.name as material_name,
    m.rate_per_kg
FROM pickup_items pi
LEFT JOIN materials m ON pi.material_id = m.id
LIMIT 5;

-- Step 5: Check the relationship between pickups and pickup_items
SELECT 'PICKUP TO ITEMS RELATIONSHIP' as check_type;
SELECT 
    p.id as pickup_id,
    p.status,
    pr.full_name as customer_name,
    COUNT(pi.id) as item_count,
    COALESCE(SUM(pi.kilograms), 0) as total_kg,
    COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0) as total_value
FROM pickups p
LEFT JOIN profiles pr ON p.customer_id = pr.id
LEFT JOIN pickup_items pi ON p.id = pi.pickup_id
LEFT JOIN materials m ON pi.material_id = m.id
GROUP BY p.id, p.status, pr.full_name
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 6: Check if materials table has data
SELECT 'CHECKING MATERIALS TABLE' as check_type;
SELECT 
    'Total materials' as metric,
    COUNT(*) as count
FROM materials
UNION ALL
SELECT 
    'Materials with rates > 0' as metric,
    COUNT(*) as count
FROM materials
WHERE rate_per_kg > 0;

-- Step 7: Show sample materials
SELECT 'SAMPLE MATERIALS' as check_type;
SELECT 
    id,
    name,
    rate_per_kg,
    co2_saved_per_kg,
    water_saved_per_kg,
    energy_saved_per_kg
FROM materials
LIMIT 5;
