-- ============================================================================
-- COMPLETE TEAM MEMBERS PAGE RESTRICTION
-- ============================================================================
-- This script ensures Team Members page is completely restricted to superadmin only

-- Step 1: Verify current role assignments
SELECT 'Current Admin and Superadmin Users:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    u.status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE r.name IN ('admin', 'superadmin')
ORDER BY r.name, u.email;

-- Step 2: Ensure admin user has correct role (not superadmin)
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'admin')
WHERE email = 'admin@wozamali.com';

-- Step 3: Ensure superadmin user has correct role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'superadmin')
WHERE email = 'superadmin@wozamali.co.za';

-- Step 4: Verify role assignments after update
SELECT 'Role Assignments AFTER Update:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    u.status,
    CASE 
        WHEN r.name = 'superadmin' THEN 'CAN access Team Members'
        WHEN r.name = 'admin' THEN 'CANNOT access Team Members'
        ELSE 'Not admin/superadmin'
    END as team_members_access
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE r.name IN ('admin', 'superadmin')
ORDER BY r.name, u.email;

SELECT 'Team Members restriction verification completed' as status;
