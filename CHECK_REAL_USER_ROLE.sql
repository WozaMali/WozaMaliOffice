-- Check the role of a real user from your database
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    r.id as role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'banelemngqi@gmail.com';

-- Or check by user ID
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    r.id as role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = '843c5c77-3ef3-4907-9ae3-e762f54e431f';
