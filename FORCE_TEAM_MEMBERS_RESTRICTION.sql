-- ============================================================================
-- FORCE TEAM MEMBERS RESTRICTION
-- ============================================================================
-- This script ensures that only superadmin users can access the Team Members page
-- by verifying role assignments and adding additional security checks.

-- Step 1: Verify current role assignments
SELECT 'Current Role Assignments:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    CASE 
        WHEN r.name = 'superadmin' THEN '✅ CAN ACCESS Team Members'
        ELSE '❌ CANNOT ACCESS Team Members'
    END as team_members_access
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email IN ('admin@wozamali.com', 'superadmin@wozamali.co.za')
ORDER BY u.email;

-- Step 2: Ensure roles table has correct permissions
GRANT SELECT ON public.roles TO authenticated, anon, service_role;
GRANT ALL ON public.roles TO service_role;

-- Step 3: Verify that admin@wozamali.com is NOT superadmin
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'admin')
WHERE email = 'admin@wozamali.com';

-- Step 4: Verify that superadmin@wozamali.co.za IS superadmin
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'superadmin')
WHERE email = 'superadmin@wozamali.co.za';

-- Step 5: Final verification
SELECT 'Final Role Verification:' as info;
SELECT 
    u.email,
    r.name as role_name,
    CASE 
        WHEN r.name = 'superadmin' THEN '✅ CAN ACCESS Team Members'
        ELSE '❌ CANNOT ACCESS Team Members'
    END as team_members_access
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email IN ('admin@wozamali.com', 'superadmin@wozamali.co.za')
ORDER BY u.email;

SELECT 'Team Members restriction enforced successfully' as status;
