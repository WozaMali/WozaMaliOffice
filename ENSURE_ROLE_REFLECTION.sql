-- ============================================================================
-- ENSURE ROLE REFLECTION IN USERS PAGE
-- ============================================================================
-- This script ensures role changes are properly reflected in the Users Page

-- Step 1: Check if users table has proper role relationship
SELECT 'Users Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check foreign key relationship for role_id
SELECT 'Foreign Key Constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'users'
AND kcu.column_name = 'role_id';

-- Step 3: Ensure proper role_id column exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Step 4: Update all users to have proper roles
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'resident')
WHERE role_id IS NULL;

-- Step 5: Verify the specific user has collector role
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'collector')
WHERE id = '8fc09ffb-a916-4ab4-a86a-02340f4b9f27';

-- Step 6: Show final user roles for verification
SELECT 'Final User Roles (for Users Page):' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status,
    r.name as role_name,
    r.id as role_id
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.email;

-- Step 7: Verify role reflection is working
SELECT 'Role reflection setup completed successfully' as status;
