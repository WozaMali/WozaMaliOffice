-- ============================================================================
-- FIX ADMIN ROLE MAPPING
-- ============================================================================
-- This script fixes the issue where admin users are being recognized as superadmin
-- by ensuring proper role mapping in the users table.

-- Step 1: Check current role assignments
SELECT 'Current Role Assignments:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    u.role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email IN ('admin@wozamali.com', 'superadmin@wozamali.co.za', 'collector@wozamali.com')
ORDER BY u.email;

-- Step 2: Ensure roles table has correct roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.roles (name) VALUES 
    ('superadmin'), 
    ('admin'), 
    ('collector'), 
    ('resident')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Fix admin user role assignment
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'admin')
WHERE email = 'admin@wozamali.com';

-- Step 4: Ensure superadmin user has correct role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'superadmin')
WHERE email = 'superadmin@wozamali.co.za';

-- Step 5: Ensure collector user has correct role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'collector')
WHERE email = 'collector@wozamali.com';

-- Step 6: Verify the role assignments after update
SELECT 'Role Assignments AFTER Update:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    u.role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.email IN ('admin@wozamali.com', 'superadmin@wozamali.co.za', 'collector@wozamali.com')
ORDER BY u.email;

-- Step 7: Show all users and their roles for verification
SELECT 'All Users and Their Roles:' as info;
SELECT 
    u.email,
    u.full_name,
    r.name as role_name,
    u.status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 8: Grant permissions on roles table
GRANT SELECT ON public.roles TO authenticated, anon, service_role;

SELECT 'Admin role mapping fix completed successfully' as status;
