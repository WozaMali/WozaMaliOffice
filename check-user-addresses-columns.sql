-- ============================================================================
-- CHECK USER_ADDRESSES TABLE COLUMNS
-- ============================================================================
-- This script checks the actual column names in the user_addresses table

-- Step 1: Check the structure of user_addresses table
SELECT 
    'User Addresses Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if there are any foreign key constraints on user_addresses
SELECT 
    'User Addresses Foreign Keys' as step,
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
AND tc.table_name = 'user_addresses'
AND tc.table_schema = 'public';

-- Step 3: Check sample data from user_addresses table
SELECT 
    'Sample User Addresses Data' as step,
    *
FROM public.user_addresses 
LIMIT 3;
