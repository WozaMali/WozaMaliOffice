-- Check admin user specifically
SELECT 'All users in user_profiles:' as info;
SELECT id, email, role, status FROM public.user_profiles ORDER BY created_at;

SELECT 'Users with admin role:' as info;
SELECT id, email, role, status FROM public.user_profiles WHERE role = 'admin';

SELECT 'Users with any admin-related role:' as info;
SELECT id, email, role, status FROM public.user_profiles WHERE role ILIKE '%admin%';

SELECT 'Check if admin@wozamali.com exists:' as info;
SELECT id, email, role, status FROM public.user_profiles WHERE email = 'admin@wozamali.com';
