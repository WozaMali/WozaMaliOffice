-- Check the role of a specific user
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    r.id as role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'd2eb9cbe-b2d0-41d3-aa2c-06e8a48f9324';
