-- ============================================================================
-- CHECK ALL USER ROLES
-- ============================================================================
-- This script checks all users and their roles in the database

-- Step 1: Show all users with their roles
SELECT 'All Users and Their Roles:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.status,
    r.name as role_name,
    r.id as role_id,
    u.created_at,
    u.updated_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 2: Show role distribution
SELECT 'Role Distribution:' as info;
SELECT 
    r.name as role_name, 
    COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.name
ORDER BY r.name;

-- Step 3: Show users without roles
SELECT 'Users Without Roles:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status
FROM public.users u
WHERE u.role_id IS NULL
ORDER BY u.email;

-- Step 4: Show specific user details
SELECT 'Specific User Details:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.status,
    r.name as role_name,
    r.id as role_id,
    u.created_at,
    u.updated_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = '8fc09ffb-a916-4ab4-a86a-02340f4b9f27';

-- Step 5: Show all available roles
SELECT 'Available Roles:' as info;
SELECT id, name, created_at
FROM public.roles
ORDER BY name;

-- Step 6: Summary
SELECT 'User Roles Check Completed' as status;
