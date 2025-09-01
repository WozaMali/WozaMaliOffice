-- ============================================================================
-- CHECK AND POPULATE MEMBER DATA FOR MEMBER PAGE
-- ============================================================================
-- This script checks if there's data for the member page and populates it if needed

-- ============================================================================
-- STEP 1: CHECK CURRENT DATA STATUS
-- ============================================================================

-- Check if user_addresses table has data
SELECT 
    'User Addresses Check' as check_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT user_id) as unique_users,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO DATA - Need to populate'
        ELSE '✅ DATA EXISTS - ' || COUNT(*) || ' addresses'
    END as status
FROM public.user_addresses;

-- Check if profiles table has member data
SELECT 
    'Profiles Check' as check_type,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'member') as member_profiles,
    CASE 
        WHEN COUNT(*) FILTER (WHERE role = 'member') = 0 THEN '❌ NO MEMBERS - Need to create members'
        ELSE '✅ MEMBERS EXIST - ' || COUNT(*) FILTER (WHERE role = 'member') || ' members'
    END as status
FROM public.profiles;

-- Check if wallets table has data
SELECT 
    'Wallets Check' as check_type,
    COUNT(*) as total_wallets,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ NO WALLETS - Need to create wallets'
        ELSE '✅ WALLETS EXIST - ' || COUNT(*) || ' wallets'
    END as status
FROM public.wallets;

-- ============================================================================
-- STEP 2: CREATE SAMPLE DATA IF NEEDED
-- ============================================================================

-- Create sample members if none exist
INSERT INTO public.profiles (
    email, full_name, first_name, last_name, phone, role, is_active, username
)
SELECT * FROM (VALUES
    ('john.doe@example.com', 'John Doe', 'John', 'Doe', '+27123456789', 'member', true, 'johndoe'),
    ('jane.smith@example.com', 'Jane Smith', 'Jane', 'Smith', '+27123456790', 'member', true, 'janesmith'),
    ('mike.johnson@example.com', 'Mike Johnson', 'Mike', 'Johnson', '+27123456791', 'member', true, 'mikejohnson'),
    ('sarah.wilson@example.com', 'Sarah Wilson', 'Sarah', 'Wilson', '+27123456792', 'member', true, 'sarahwilson'),
    ('david.brown@example.com', 'David Brown', 'David', 'Brown', '+27123456793', 'member', true, 'davidbrown')
) AS v(email, full_name, first_name, last_name, phone, role, is_active, username)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'member' LIMIT 1);

-- Create wallets for members if none exist
INSERT INTO public.wallets (user_id, balance, total_points, tier)
SELECT 
    p.id,
    ROUND((RANDOM() * 500 + 50)::numeric, 2), -- Random balance between 50-550
    FLOOR(RANDOM() * 1000 + 100), -- Random points between 100-1100
    CASE 
        WHEN FLOOR(RANDOM() * 1000 + 100) >= 1000 THEN 'Diamond Recycler'
        WHEN FLOOR(RANDOM() * 1000 + 100) >= 500 THEN 'Platinum Recycler'
        WHEN FLOOR(RANDOM() * 1000 + 100) >= 250 THEN 'Gold Recycler'
        WHEN FLOOR(RANDOM() * 1000 + 100) >= 100 THEN 'Silver Recycler'
        ELSE 'Bronze Recycler'
    END
FROM public.profiles p
WHERE p.role = 'member' 
AND NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = p.id);

-- Create sample addresses for members if none exist
INSERT INTO public.user_addresses (
    user_id, address_type, address_line1, address_line2, city, province, postal_code, country, is_default, is_active, notes
)
SELECT 
    p.id,
    'primary',
    '123 Main Street',
    'Unit 1',
    'Cape Town',
    'Western Cape',
    '8001',
    'South Africa',
    true,
    true,
    'Main residence'
FROM public.profiles p
WHERE p.role = 'member' 
AND NOT EXISTS (SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = p.id AND ua.address_type = 'primary');

-- Create pickup addresses for some members
INSERT INTO public.user_addresses (
    user_id, address_type, address_line1, address_line2, city, province, postal_code, country, is_default, is_active, notes
)
SELECT 
    p.id,
    'pickup',
    '456 Business Park',
    'Building A',
    'Cape Town',
    'Western Cape',
    '8002',
    'South Africa',
    false,
    true,
    'Office building - call when arriving'
FROM public.profiles p
WHERE p.role = 'member' 
AND p.id IN (
    SELECT id FROM public.profiles WHERE role = 'member' LIMIT 3
)
AND NOT EXISTS (SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = p.id AND ua.address_type = 'pickup');

-- Create secondary addresses for some members
INSERT INTO public.user_addresses (
    user_id, address_type, address_line1, address_line2, city, province, postal_code, country, is_default, is_active, notes
)
SELECT 
    p.id,
    'secondary',
    '789 Residential Complex',
    'Apartment 5B',
    'Cape Town',
    'Western Cape',
    '8003',
    'South Africa',
    false,
    true,
    'Weekend home'
FROM public.profiles p
WHERE p.role = 'member' 
AND p.id IN (
    SELECT id FROM public.profiles WHERE role = 'member' LIMIT 2
)
AND NOT EXISTS (SELECT 1 FROM public.user_addresses ua WHERE ua.user_id = p.id AND ua.address_type = 'secondary');

-- ============================================================================
-- STEP 3: VERIFY DATA WAS CREATED
-- ============================================================================

-- Final verification
SELECT 
    'Final Verification' as check_type,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'member') as total_members,
    (SELECT COUNT(*) FROM public.user_addresses) as total_addresses,
    (SELECT COUNT(*) FROM public.wallets) as total_wallets,
    (SELECT COUNT(*) FROM public.office_member_user_addresses_view) as view_records,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.office_member_user_addresses_view) > 0 THEN '✅ READY FOR MEMBER PAGE'
        ELSE '❌ STILL NO DATA - Check for errors'
    END as status;

-- Show sample data
SELECT 
    'Sample Member Data' as test_type,
    member_id,
    full_name,
    email,
    address_type,
    address_line1,
    city,
    province,
    is_default,
    wallet_balance,
    total_points,
    tier
FROM public.office_member_user_addresses_view
LIMIT 5;
