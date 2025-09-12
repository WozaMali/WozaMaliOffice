-- Check all points transactions
SELECT 
    up.email,
    pt.points,
    pt.transaction_type,
    pt.description,
    pt.created_at
FROM public.points_transactions pt
JOIN public.user_wallets uw ON pt.wallet_id = uw.id
JOIN public.user_profiles up ON uw.user_id = up.id
ORDER BY pt.created_at DESC;
