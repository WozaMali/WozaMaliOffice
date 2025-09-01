-- Check Member Data and Addresses
-- This script helps diagnose why members are showing as "Unknown Customer" and "No address"

-- 1. Check if profiles table has member data
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE role = 'member') as member_count,
    COUNT(*) FILTER (WHERE role = 'collector') as collector_count
FROM profiles;

-- 2. Show sample member profiles
SELECT 
    id,
    email,
    first_name,
    last_name,
    username,
    role,
    is_active,
    phone,
    created_at
FROM profiles 
WHERE role = 'member' 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if addresses table has data
SELECT 
    'addresses' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE profile_id IN (SELECT id FROM profiles WHERE role = 'member')) as member_addresses,
    COUNT(*) FILTER (WHERE profile_id IN (SELECT id FROM profiles WHERE role = 'collector')) as collector_addresses
FROM addresses;

-- 4. Show sample addresses for members
SELECT 
    a.id,
    a.profile_id,
    p.email as member_email,
    p.first_name,
    p.last_name,
    a.line1,
    a.suburb,
    a.city,
    a.postal_code,
    a.is_primary,
    a.created_at
FROM addresses a
JOIN profiles p ON a.profile_id = p.id
WHERE p.role = 'member'
ORDER BY a.created_at DESC
LIMIT 10;

-- 5. Check if the view exists and has data
SELECT 
    'customer_profiles_with_addresses_view' as view_name,
    COUNT(*) as view_count
FROM information_schema.views 
WHERE table_name = 'customer_profiles_with_addresses_view';

-- 6. Test the view directly (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'customer_profiles_with_addresses_view') THEN
        RAISE NOTICE 'View exists - testing data access...';
        -- This will show the actual data in the view
        PERFORM COUNT(*) FROM customer_profiles_with_addresses_view;
        RAISE NOTICE 'View has data - count: %', (SELECT COUNT(*) FROM customer_profiles_with_addresses_view);
    ELSE
        RAISE NOTICE 'View does not exist!';
    END IF;
END $$;

-- 7. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'addresses');

-- 8. Check table permissions
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'addresses')
AND grantee = 'authenticated';

-- 9. Test direct table access
SELECT 
    'Direct profiles access' as test,
    COUNT(*) as count
FROM profiles 
WHERE role = 'member';

SELECT 
    'Direct addresses access' as test,
    COUNT(*) as count
FROM addresses 
WHERE profile_id IN (SELECT id FROM profiles WHERE role = 'member');
