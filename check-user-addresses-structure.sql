-- ============================================================================
-- CHECK USER_ADDRESSES TABLE STRUCTURE
-- ============================================================================
-- This script checks the actual structure of the user_addresses table

-- Step 1: Check the structure of user_addresses table
SELECT 
    'User Addresses Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check the structure of profiles table
SELECT 
    'Profiles Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if there are any addresses in user_addresses
SELECT 
    'User Addresses Data Check' as step,
    COUNT(*) as total_addresses
FROM public.user_addresses;

-- Step 4: Show sample data from user_addresses (using correct column names)
SELECT 
    'Sample User Addresses Data' as step,
    *
FROM public.user_addresses 
LIMIT 3;

-- Step 5: Check if there are any profiles
SELECT 
    'Profiles Data Check' as step,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'member') as member_profiles
FROM public.profiles;

-- Step 6: Show sample profiles data
SELECT 
    'Sample Profiles Data' as step,
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM public.profiles 
WHERE role = 'member'
LIMIT 3;
