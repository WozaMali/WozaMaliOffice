-- ============================================================================
-- FIX SPECIFIC USER ROLE
-- ============================================================================
-- This script ensures a specific user has the correct role

-- Step 1: Show the specific user's current role
SELECT 'Specific user BEFORE role update:' as info;
SELECT u.id, u.email, r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = '8fc09ffb-a916-4ab4-a86a-02340f4b9f27';

-- Step 2: Update the specific user to collector role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'collector')
WHERE id = '8fc09ffb-a916-4ab4-a86a-02340f4b9f27';

-- Step 3: Show the specific user's updated role
SELECT 'Specific user AFTER role update:' as info;
SELECT u.id, u.email, r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = '8fc09ffb-a916-4ab4-a86a-02340f4b9f27';

-- Step 4: Show all users and their roles
SELECT 'All users and their roles:' as info;
SELECT u.id, u.email, r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 5: Show role distribution
SELECT 'Role Distribution:' as info;
SELECT r.name as role_name, COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.name
ORDER BY r.name;

-- Step 6: Verify the fix
SELECT 'Specific user role fix completed successfully' as status;
