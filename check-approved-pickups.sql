-- ============================================================================
-- CHECK APPROVED PICKUPS IN UNIFIED TABLES
-- ============================================================================
-- This script checks the current state of approved/declined pickups

-- ============================================================================
-- STEP 1: CHECK UNIFIED_COLLECTIONS TABLE
-- ============================================================================

SELECT 'UNIFIED_COLLECTIONS - ALL RECORDS:' as info;
SELECT 
    id,
    collection_code,
    customer_name,
    customer_email,
    status,
    total_weight_kg,
    total_value,
    created_at,
    updated_at,
    updated_by,
    admin_notes
FROM public.unified_collections
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: CHECK STATUS BREAKDOWN
-- ============================================================================

SELECT 'STATUS BREAKDOWN:' as info;
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_weight_kg) as total_weight,
    SUM(total_value) as total_value
FROM public.unified_collections
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- STEP 3: CHECK RECENT APPROVALS
-- ============================================================================

SELECT 'RECENT APPROVALS (LAST 7 DAYS):' as info;
SELECT 
    id,
    collection_code,
    customer_name,
    status,
    total_weight_kg,
    total_value,
    updated_at,
    admin_notes
FROM public.unified_collections
WHERE status IN ('approved', 'rejected')
AND updated_at >= NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 4: CHECK USER_WALLETS FOR APPROVED CUSTOMERS
-- ============================================================================

SELECT 'WALLET UPDATES FOR APPROVED CUSTOMERS:' as info;
SELECT 
    uw.id as wallet_id,
    uw.user_id,
    up.full_name as customer_name,
    uw.current_points,
    uw.total_points_earned,
    uw.total_points_spent,
    uw.last_updated
FROM public.user_wallets uw
JOIN public.user_profiles up ON up.id = uw.user_id
WHERE uw.user_id IN (
    SELECT DISTINCT customer_id 
    FROM public.unified_collections 
    WHERE status = 'approved' 
    AND customer_id IS NOT NULL
)
ORDER BY uw.last_updated DESC;

-- ============================================================================
-- STEP 5: CHECK POINTS_TRANSACTIONS FOR APPROVED COLLECTIONS
-- ============================================================================

SELECT 'POINTS_TRANSACTIONS FOR APPROVED COLLECTIONS:' as info;
SELECT 
    pt.id,
    pt.wallet_id,
    pt.transaction_type,
    pt.points,
    pt.balance_after,
    pt.source,
    pt.description,
    pt.created_at,
    up.full_name as customer_name
FROM public.points_transactions pt
JOIN public.user_wallets uw ON uw.id = pt.wallet_id
JOIN public.user_profiles up ON up.id = uw.user_id
WHERE pt.source = 'collection_approval'
ORDER BY pt.created_at DESC;

-- ============================================================================
-- STEP 6: SUMMARY
-- ============================================================================

SELECT 'SUMMARY:' as info;
SELECT 
    'Total Collections' as metric,
    COUNT(*) as value
FROM public.unified_collections
UNION ALL
SELECT 
    'Approved Collections',
    COUNT(*)
FROM public.unified_collections
WHERE status = 'approved'
UNION ALL
SELECT 
    'Rejected Collections',
    COUNT(*)
FROM public.unified_collections
WHERE status = 'rejected'
UNION ALL
SELECT 
    'Pending Collections',
    COUNT(*)
FROM public.unified_collections
WHERE status = 'submitted'
UNION ALL
SELECT 
    'Total Weight (kg)',
    COALESCE(SUM(total_weight_kg), 0)
FROM public.unified_collections
WHERE status = 'approved'
UNION ALL
SELECT 
    'Total Value (R)',
    COALESCE(SUM(total_value), 0)
FROM public.unified_collections
WHERE status = 'approved';
