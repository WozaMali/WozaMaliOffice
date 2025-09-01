-- ============================================================================
-- CHECK PICKUPS TABLE STRUCTURE
-- ============================================================================
-- This script checks the actual structure of the pickups table

-- Step 1: Check if pickups table exists
SELECT 'CHECKING IF PICKUPS TABLE EXISTS' as check_type;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pickups'
) as table_exists;

-- Step 2: Show pickups table structure
SELECT 'PICKUPS TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'pickups'
ORDER BY ordinal_position;

-- Step 3: Check for customer/user related columns
SELECT 'LOOKING FOR CUSTOMER/USER COLUMNS' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pickups'
AND (
    column_name ILIKE '%user%' OR 
    column_name ILIKE '%customer%' OR 
    column_name ILIKE '%member%' OR
    column_name ILIKE '%client%'
)
ORDER BY column_name;

-- Step 4: Check for collector related columns
SELECT 'LOOKING FOR COLLECTOR COLUMNS' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pickups'
AND (
    column_name ILIKE '%collector%' OR 
    column_name ILIKE '%driver%' OR
    column_name ILIKE '%staff%'
)
ORDER BY column_name;

-- Step 5: Show sample data structure (if table exists and has data)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pickups'
    ) THEN
        IF (SELECT COUNT(*) FROM pickups) > 0 THEN
            RAISE NOTICE 'Sample pickup record structure:';
            RAISE NOTICE '%', (SELECT row_to_json(pickups.*) FROM pickups LIMIT 1);
        ELSE
            RAISE NOTICE 'Pickups table exists but has no data';
        END IF;
    ELSE
        RAISE NOTICE 'Pickups table does not exist';
    END IF;
END $$;

-- Step 6: Check if we need to create the pickups table
SELECT 'CHECKING IF WE NEED TO CREATE PICKUPS TABLE' as check_type;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'pickups'
        ) THEN 'Table exists - check structure above'
        ELSE 'Table missing - needs to be created'
    END as status;
