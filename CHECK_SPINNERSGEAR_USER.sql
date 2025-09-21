-- Check the role of spinnersgear1020@gmail.com
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status,
    r.name as role_name,
    r.id as role_id,
    u.created_at,
    u.updated_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email = 'spinnersgear1020@gmail.com';
