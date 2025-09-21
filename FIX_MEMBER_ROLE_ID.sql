-- Fix all users with the specific MEMBER role_id
-- Update all users with role_id '00000000-0000-0000-0000-000000000005' to resident
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id = '00000000-0000-0000-0000-000000000005';

-- Verify the update
SELECT 
    u.email,
    r.name as role_name,
    u.role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;
