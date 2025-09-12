-- ============================================================================
-- CHECK ACTUAL TABLES AND CONSTRAINTS
-- ============================================================================
-- This script checks what tables actually exist and what foreign key constraints are set up

-- Step 1: Check if pickups table exists
SELECT 
    'Pickups Table Check' as step,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('pickups', 'collections')
AND table_schema = 'public';

-- Step 2: Check if collections table exists
SELECT 
    'Collections Table Check' as step,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'collections'
AND table_schema = 'public';

-- Step 3: Check foreign key constraints on pickups table (if it exists)
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

-- Step 4: Check foreign key constraints on collections table (if it exists)
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

-- Step 5: Check the structure of pickups table (if it exists)
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

-- Step 6: Check the structure of collections table (if it exists)
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

-- Step 7: Check if there are any records in pickups table
SELECT 
    'Pickups Table Data Check' as step,
    COUNT(*) as total_pickups
FROM public.pickups;

-- Step 8: Check if there are any records in collections table
SELECT 
    'Collections Table Data Check' as step,
    COUNT(*) as total_collections
FROM public.collections;
