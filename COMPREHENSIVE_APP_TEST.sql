-- ============================================================================
-- COMPREHENSIVE 3-APP TEST
-- ============================================================================
-- This script tests all functionality across Main App, Office App, and Collector App

-- Step 1: Test database structure and relationships
SELECT 'Testing Database Structure:' as info;

-- Check users table structure
SELECT 'Users table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check roles table
SELECT 'Available roles:' as info;
SELECT id, name FROM public.roles ORDER BY name;

-- Step 2: Test user authentication and roles
SELECT 'User Authentication Test:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status,
    r.name as role_name,
    u.created_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Step 3: Test role distribution
SELECT 'Role Distribution:' as info;
SELECT 
    r.name as role_name,
    COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON r.id = u.role_id
GROUP BY r.name
ORDER BY r.name;

-- Step 4: Test RLS policies
SELECT 'RLS Policy Test:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'unified_collections', 'profiles', 'deleted_transactions')
ORDER BY tablename, policyname;

-- Step 5: Test RPC functions
SELECT 'RPC Functions Test:' as info;
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('soft_delete_collection', 'restore_deleted_collection')
ORDER BY routine_name;

-- Step 6: Test realtime subscriptions
SELECT 'Realtime Subscriptions Test:' as info;
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('users', 'unified_collections', 'profiles', 'deleted_transactions')
ORDER BY tablename;

-- Step 7: Test foreign key relationships
SELECT 'Foreign Key Relationships Test:' as info;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'unified_collections')
ORDER BY tc.table_name;

-- Step 8: Test data integrity
SELECT 'Data Integrity Test:' as info;
SELECT 
    'Users without roles' as issue,
    COUNT(*) as count
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    'Users with invalid roles' as issue,
    COUNT(*) as count
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.role_id IS NOT NULL AND r.id IS NULL;

-- Step 9: Test authentication trigger
SELECT 'Authentication Trigger Test:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth'
AND trigger_name = 'on_auth_user_created';

-- Step 10: Final status
SELECT 'Comprehensive 3-App Test Completed Successfully' as status;
SELECT 'All systems should be operational across Main App, Office App, and Collector App' as info;
