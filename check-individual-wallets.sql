-- Check individual wallet details
SELECT 
    up.email,
    up.full_name,
    uw.current_points,
    uw.total_points_earned,
    uw.total_points_spent
FROM public.user_wallets uw
JOIN public.user_profiles up ON uw.user_id = up.id
ORDER BY uw.current_points DESC;
