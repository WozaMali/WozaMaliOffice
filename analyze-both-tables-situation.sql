-- ============================================================================
-- ANALYZE BOTH TABLES SITUATION
-- ============================================================================
-- This script analyzes the situation where both collections and pickups tables exist

-- Step 1: Check the structure of both tables to understand the difference
SELECT 
    'Collections Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check the structure of pickups table
SELECT 
    'Pickups Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check foreign key constraints on collections table
SELECT 
    'Collections Table Foreign Keys' as step,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'collections'
AND tc.table_schema = 'public';

-- Step 4: Check foreign key constraints on pickups table
SELECT 
    'Pickups Table Foreign Keys' as step,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'pickups'
AND tc.table_schema = 'public';

-- Step 5: Check sample data from collections table
SELECT 
    'Sample Collections Data' as step,
    *
FROM public.collections 
LIMIT 2;

-- Step 6: Check sample data from pickups table
SELECT 
    'Sample Pickups Data' as step,
    *
FROM public.pickups 
LIMIT 2;

-- Step 7: Check if there are any pickup_items records
SELECT 
    'Pickup Items Check' as step,
    COUNT(*) as total_pickup_items
FROM public.pickup_items;

-- Step 8: Check if pickup_items references collections or pickups
SELECT 
    'Pickup Items Foreign Keys' as step,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'pickup_items'
AND tc.table_schema = 'public';
