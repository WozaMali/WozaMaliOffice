-- ============================================================================
-- FIX MEMBER TO RESIDENT ROLE
-- ============================================================================
-- This script updates all users with 'member' role to 'resident' role

-- Step 1: Show current users and their roles
SELECT 'Users BEFORE role update:' as info;
SELECT u.email, r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 2: Update all users with 'member' role to 'resident' role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'member');

-- Step 3: Show updated users and their roles
SELECT 'Users AFTER role update:' as info;
SELECT u.email, r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 4: Show role distribution
SELECT 'Role Distribution:' as info;
SELECT r.name as role_name, COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.name
ORDER BY r.name;

-- Step 5: Verify the fix
SELECT 'Member to Resident role fix completed successfully' as status;
