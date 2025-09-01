-- ============================================================================
-- CHECK PICKUP TABLE STRUCTURE AND FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Check the current pickup table structure and foreign key constraints

-- Check pickup table structure
SELECT 
    'Pickup Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on pickups table
SELECT 
    'Foreign Key Constraints' as check_type,
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

-- Check if addresses table still exists
SELECT 
    'Addresses Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') 
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status;

-- Check if user_addresses table exists
SELECT 
    'User Addresses Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_addresses' AND table_schema = 'public') 
        THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status;

-- Check sample data in pickups table
SELECT 
    'Sample Pickup Data' as check_type,
    id,
    customer_id,
    collector_id,
    address_id,
    status,
    created_at
FROM public.pickups
LIMIT 3;
