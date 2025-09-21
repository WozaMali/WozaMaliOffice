-- Force update all member roles to resident
-- First, let's see what we have
SELECT 'BEFORE UPDATE:' as status;
SELECT 
    u.email,
    r.name as role_name,
    u.role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE r.name = 'member' OR u.role_id IS NULL;

-- Update all users with member role to resident
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'member');

-- Update users with NULL role_id to resident
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id IS NULL;

-- Show results after update
SELECT 'AFTER UPDATE:' as status;
SELECT 
    u.email,
    r.name as role_name,
    u.role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;
