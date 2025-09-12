-- ============================================================================
-- CHECK CURRENT FUNCTIONALITY
-- ============================================================================
-- This script checks what's currently working in the system

-- ============================================================================
-- STEP 1: CHECK APPROVED COLLECTIONS
-- ============================================================================

SELECT 'APPROVED COLLECTIONS:' as info;
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
    admin_notes
FROM public.unified_collections
WHERE status = 'approved'
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 2: CHECK WALLET UPDATES
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
-- STEP 3: CHECK POINTS TRANSACTIONS
-- ============================================================================

SELECT 'POINTS TRANSACTIONS:' as info;
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
-- STEP 4: CHECK ADMIN USER
-- ============================================================================

SELECT 'ADMIN USER STATUS:' as info;
SELECT 
    id,
    email,
    role,
    is_active,
    created_at
FROM public.user_profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- ============================================================================
-- STEP 5: SUMMARY
-- ============================================================================

SELECT 'SYSTEM SUMMARY:' as info;
SELECT 
    'Total Collections' as metric,
    COUNT(*)::text as value
FROM public.unified_collections
UNION ALL
SELECT 
    'Approved Collections',
    COUNT(*)::text
FROM public.unified_collections
WHERE status = 'approved'
UNION ALL
SELECT 
    'Total Weight (kg)',
    COALESCE(SUM(total_weight_kg), 0)::text
FROM public.unified_collections
WHERE status = 'approved'
UNION ALL
SELECT 
    'Total Value (R)',
    COALESCE(SUM(total_value), 0)::text
FROM public.unified_collections
WHERE status = 'approved'
UNION ALL
SELECT 
    'Active Wallets',
    COUNT(*)::text
FROM public.user_wallets
UNION ALL
SELECT 
    'Points Transactions',
    COUNT(*)::text
FROM public.points_transactions;
