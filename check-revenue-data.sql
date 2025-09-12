-- Check revenue data discrepancy
-- This query will show us what data is actually in the database

-- 1. Check unified_collections data
SELECT 'UNIFIED_COLLECTIONS_DATA' as source;
SELECT 
    id,
    status,
    computed_value,
    total_value,
    total_weight_kg,
    customer_name,
    created_at
FROM public.unified_collections
WHERE status IN ('approved', 'completed')
ORDER BY created_at DESC;

-- 2. Sum of approved/completed collections
SELECT 'UNIFIED_COLLECTIONS_SUM' as source;
SELECT 
    COUNT(*) as total_collections,
    SUM(COALESCE(computed_value, total_value, 0)) as total_revenue,
    SUM(total_weight_kg) as total_weight
FROM public.unified_collections
WHERE status IN ('approved', 'completed');

-- 3. Check wallet_transactions data
SELECT 'WALLET_TRANSACTIONS_DATA' as source;
SELECT 
    amount,
    source_type,
    created_at
FROM public.wallet_transactions
WHERE source_type IN ('collection_approval', 'earned', 'credit')
ORDER BY created_at DESC;

-- 4. Sum of wallet_transactions
SELECT 'WALLET_TRANSACTIONS_SUM' as source;
SELECT 
    COUNT(*) as total_transactions,
    SUM(amount) as total_revenue
FROM public.wallet_transactions
WHERE source_type IN ('collection_approval', 'earned', 'credit');

-- 5. Check transactions table data (without status column)
SELECT 'TRANSACTIONS_DATA' as source;
SELECT 
    amount,
    transaction_type,
    created_at
FROM public.transactions
WHERE transaction_type IN ('earned', 'credit')
ORDER BY created_at DESC;

-- 6. Sum of transactions table
SELECT 'TRANSACTIONS_SUM' as source;
SELECT 
    COUNT(*) as total_transactions,
    SUM(amount) as total_revenue
FROM public.transactions
WHERE transaction_type IN ('earned', 'credit');
