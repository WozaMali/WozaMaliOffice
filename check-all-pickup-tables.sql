-- ============================================================================
-- CHECK ALL PICKUP-RELATED TABLES
-- ============================================================================
-- This script checks all tables that might contain pickups

-- ============================================================================
-- STEP 1: CHECK UNIFIED_COLLECTIONS TABLE
-- ============================================================================

SELECT 'UNIFIED_COLLECTIONS TABLE:' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM public.unified_collections;

-- ============================================================================
-- STEP 2: CHECK IF PICKUPS TABLE EXISTS
-- ============================================================================

SELECT 'PICKUPS TABLE CHECK:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'pickups' 
            AND table_schema = 'public'
        ) THEN 'pickups table exists'
        ELSE 'pickups table does not exist'
    END as table_status;

-- ============================================================================
-- STEP 3: CHECK PICKUPS TABLE IF IT EXISTS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pickups' 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'SELECT ''PICKUPS TABLE DATA:'' as info;';
        EXECUTE 'SELECT status, COUNT(*) as count FROM public.pickups GROUP BY status ORDER BY count DESC;';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: CHECK COLLECTION_PICKUPS TABLE IF IT EXISTS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'collection_pickups' 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'SELECT ''COLLECTION_PICKUPS TABLE DATA:'' as info;';
        EXECUTE 'SELECT status, COUNT(*) as count FROM public.collection_pickups GROUP BY status ORDER BY count DESC;';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CHECK ALL TABLES WITH 'PICKUP' IN NAME
-- ============================================================================

SELECT 'TABLES WITH PICKUP IN NAME:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%pickup%' 
AND table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- STEP 6: CHECK ALL TABLES WITH 'COLLECTION' IN NAME
-- ============================================================================

SELECT 'TABLES WITH COLLECTION IN NAME:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%collection%' 
AND table_schema = 'public'
ORDER BY table_name;
