-- ============================================================================
-- FIX USER ROLES
-- ============================================================================
-- This script fixes user roles based on email addresses and current roles

-- Step 1: First, let's see what roles and users we currently have
SELECT 'Current users and roles:' as info;
SELECT u.email, u.full_name, r.name as role_name, u.id as user_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 2: Update specific users based on their email addresses
-- Update collector@wozamali.com to collector role
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'collector')
WHERE email = 'collector@wozamali.com';

-- Update admin@wozamali.com to admin role
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'admin')
WHERE email = 'admin@wozamali.com';

-- Update superadmin@wozamali.co.za to superadmin role
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'superadmin')
WHERE email = 'superadmin@wozamali.co.za';

-- Step 3: Update all users with 'member' role to 'resident' role
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'member');

-- Step 4: Update any users without a role to 'resident' role
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id IS NULL;

-- Step 5: Show the updated users and roles
SELECT 'Updated users and roles:' as info;
SELECT u.email, u.full_name, r.name as role_name, u.id as user_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 6: Verify the role distribution
SELECT 'Role distribution:' as info;
SELECT r.name as role_name, COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.id, r.name
ORDER BY r.name;

-- Step 7: Show any users that still don't have proper roles
SELECT 'Users without proper roles:' as info;
SELECT u.email, u.full_name, u.role_id
FROM public.users u
WHERE u.role_id IS NULL OR u.role_id NOT IN (SELECT id FROM public.roles);

SELECT 'User roles fix completed successfully' as status;
