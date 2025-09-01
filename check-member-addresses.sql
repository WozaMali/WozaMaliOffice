-- ============================================================================
-- CHECK MEMBER ADDRESSES TABLE STRUCTURE
-- ============================================================================
-- This script checks the current address table structure and creates
-- comprehensive views for member addresses to be used in collection and office apps

-- ============================================================================
-- STEP 1: CHECK CURRENT ADDRESS TABLE STRUCTURE
-- ============================================================================

-- Check the current structure of the addresses table
SELECT 
    'Address Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'addresses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the actual columns that exist
SELECT 
    'Available Columns' as check_type,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'addresses' 
    AND table_schema = 'public';

-- ============================================================================
-- STEP 2: CHECK CURRENT DATA IN ADDRESSES TABLE
-- ============================================================================

-- Check current addresses data
SELECT 
    'Current Addresses Data' as check_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(*) FILTER (WHERE is_primary = true) as primary_addresses,
    COUNT(*) FILTER (WHERE is_active = true) as active_addresses
FROM addresses;

-- ============================================================================
-- STEP 3: CHECK ADDRESS COLUMN MAPPING
-- ============================================================================

-- Check if we have both customer_id and profile_id columns
SELECT 
    'Column Mapping Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = 'customer_id') 
        THEN 'customer_id exists'
        ELSE 'customer_id missing'
    END as customer_id_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = 'profile_id') 
        THEN 'profile_id exists'
        ELSE 'profile_id missing'
    END as profile_id_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = 'line1') 
        THEN 'line1 exists'
        ELSE 'line1 missing'
    END as line1_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = 'street_address') 
        THEN 'street_address exists'
        ELSE 'street_address missing'
    END as street_address_status;

-- ============================================================================
-- STEP 4: CREATE UNIFIED MEMBER ADDRESSES VIEW
-- ============================================================================

-- Create a comprehensive view for member addresses that works with both column structures
CREATE OR REPLACE VIEW public.member_addresses_view AS
SELECT 
    a.id,
    a.customer_id as member_id,
    a.street_address as address_line1,
    a.suburb,
    a.city,
    a.postal_code,
    a.latitude,
    a.longitude,
    COALESCE(a.is_primary, false) as is_primary,
    COALESCE(a.is_active, true) as is_active,
    a.created_at,
    a.updated_at,
    -- Member profile information
    p.email,
    p.full_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.is_active as member_is_active,
    -- Formatted address for display
    CONCAT(
        COALESCE(a.street_address, ''), 
        CASE WHEN a.suburb IS NOT NULL AND a.suburb != '' THEN ', ' || a.suburb ELSE '' END,
        CASE WHEN a.city IS NOT NULL AND a.city != '' THEN ', ' || a.city ELSE '' END,
        CASE WHEN a.postal_code IS NOT NULL AND a.postal_code != '' THEN ' ' || a.postal_code ELSE '' END
    ) as formatted_address,
    -- Short address for lists
    CONCAT(
        COALESCE(a.street_address, ''), 
        CASE WHEN a.suburb IS NOT NULL AND a.suburb != '' THEN ', ' || a.suburb ELSE '' END
    ) as short_address
FROM addresses a
LEFT JOIN profiles p ON a.customer_id = p.id
WHERE p.role = 'member' AND p.is_active = true;

-- ============================================================================
-- STEP 5: CREATE MEMBER ADDRESSES WITH PICKUP INFO VIEW
-- ============================================================================

-- Create a view that includes pickup information for each address
CREATE OR REPLACE VIEW public.member_addresses_with_pickups_view AS
SELECT 
    ma.*,
    COUNT(pk.id) as total_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'completed') as completed_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'submitted') as pending_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'in_progress') as in_progress_pickups,
    MAX(pk.created_at) as last_pickup_date,
    MAX(pk.submitted_at) as last_submission_date,
    -- Pickup statistics
    COALESCE(SUM(pi.total_kg), 0) as total_kg_collected,
    COALESCE(SUM(pi.total_value), 0.00) as total_value_collected
FROM public.member_addresses_view ma
LEFT JOIN pickups pk ON ma.id = pk.address_id
LEFT JOIN (
    SELECT 
        pickup_id,
        SUM(kilograms) as total_kg,
        SUM(kilograms * m.rate_per_kg) as total_value
    FROM pickup_items pi
    JOIN materials m ON pi.material_id = m.id
    GROUP BY pickup_id
) pi ON pk.id = pi.pickup_id
GROUP BY ma.id, ma.member_id, ma.address_line1, ma.suburb, ma.city, 
         ma.postal_code, ma.latitude, ma.longitude, ma.is_primary, ma.is_active, 
         ma.created_at, ma.updated_at, ma.email, ma.full_name, ma.first_name, 
         ma.last_name, ma.phone, ma.role, ma.member_is_active, ma.formatted_address, 
         ma.short_address;

-- ============================================================================
-- STEP 6: CREATE MEMBER ADDRESSES FOR COLLECTION APP VIEW
-- ============================================================================

-- Create a simplified view specifically for the collection app
CREATE OR REPLACE VIEW public.collection_member_addresses_view AS
SELECT 
    a.id as address_id,
    a.customer_id as member_id,
    p.full_name as member_name,
    p.phone as member_phone,
    p.email as member_email,
    a.street_address,
    a.suburb,
    a.city,
    a.postal_code,
    a.latitude,
    a.longitude,
    COALESCE(a.is_primary, false) as is_primary,
    -- Formatted address for display
    CONCAT(
        COALESCE(a.street_address, ''), 
        CASE WHEN a.suburb IS NOT NULL AND a.suburb != '' THEN ', ' || a.suburb ELSE '' END,
        CASE WHEN a.city IS NOT NULL AND a.city != '' THEN ', ' || a.city ELSE '' END
    ) as display_address,
    -- Collection history
    COUNT(pk.id) as total_collections,
    MAX(pk.created_at) as last_collection_date,
    -- Status indicators
    CASE 
        WHEN COUNT(pk.id) = 0 THEN 'new_customer'
        WHEN MAX(pk.created_at) > NOW() - INTERVAL '30 days' THEN 'active'
        WHEN MAX(pk.created_at) > NOW() - INTERVAL '90 days' THEN 'inactive'
        ELSE 'dormant'
    END as customer_status
FROM addresses a
JOIN profiles p ON a.customer_id = p.id
LEFT JOIN pickups pk ON a.id = pk.address_id
WHERE p.role = 'member' AND p.is_active = true
GROUP BY a.id, a.customer_id, p.full_name, p.phone, p.email,
         a.street_address, a.suburb, a.city, a.postal_code, 
         a.latitude, a.longitude, a.is_primary;

-- ============================================================================
-- STEP 7: CREATE MEMBER ADDRESSES FOR OFFICE APP VIEW
-- ============================================================================

-- Create a comprehensive view for the office app with full details
CREATE OR REPLACE VIEW public.office_member_addresses_view AS
SELECT 
    a.id as address_id,
    a.customer_id as member_id,
    p.email,
    p.full_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.is_active as member_is_active,
    p.created_at as member_since,
    -- Address details
    a.street_address,
    a.suburb,
    a.city,
    a.postal_code,
    a.latitude,
    a.longitude,
    COALESCE(a.is_primary, false) as is_primary,
    COALESCE(a.is_active, true) as address_is_active,
    a.created_at as address_created,
    a.updated_at as address_updated,
    -- Formatted addresses
    CONCAT(
        COALESCE(a.street_address, ''), 
        CASE WHEN a.suburb IS NOT NULL AND a.suburb != '' THEN ', ' || a.suburb ELSE '' END,
        CASE WHEN a.city IS NOT NULL AND a.city != '' THEN ', ' || a.city ELSE '' END,
        CASE WHEN a.postal_code IS NOT NULL AND a.postal_code != '' THEN ' ' || a.postal_code ELSE '' END
    ) as full_address,
    -- Collection statistics
    COUNT(pk.id) as total_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'completed') as completed_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'submitted') as pending_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'in_progress') as in_progress_pickups,
    COUNT(pk.id) FILTER (WHERE pk.status = 'cancelled') as cancelled_pickups,
    MAX(pk.created_at) as last_pickup_date,
    MAX(pk.submitted_at) as last_submission_date,
    -- Financial statistics
    COALESCE(SUM(pi.total_kg), 0) as total_kg_collected,
    COALESCE(SUM(pi.total_value), 0.00) as total_value_collected,
    COALESCE(AVG(pi.total_kg), 0) as avg_kg_per_pickup,
    -- Wallet information
    COALESCE(w.balance, 0.00) as wallet_balance,
    COALESCE(w.total_points, 0) as total_points,
    COALESCE(w.tier, 'Bronze Recycler') as tier
FROM addresses a
JOIN profiles p ON a.customer_id = p.id
LEFT JOIN pickups pk ON a.id = pk.address_id
LEFT JOIN wallets w ON p.id = w.user_id
LEFT JOIN (
    SELECT 
        pickup_id,
        SUM(kilograms) as total_kg,
        SUM(kilograms * m.rate_per_kg) as total_value
    FROM pickup_items pi
    JOIN materials m ON pi.material_id = m.id
    GROUP BY pickup_id
) pi ON pk.id = pi.pickup_id
WHERE p.role = 'member'
GROUP BY a.id, a.customer_id, p.email, p.full_name, p.first_name, 
         p.last_name, p.phone, p.role, p.is_active, p.created_at, a.street_address, 
         a.suburb, a.city, a.postal_code, a.latitude, 
         a.longitude, a.is_primary, a.is_active, a.created_at, 
         a.updated_at, w.balance, w.total_points, w.tier;

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on the new views
GRANT SELECT ON public.member_addresses_view TO authenticated;
GRANT SELECT ON public.member_addresses_with_pickups_view TO authenticated;
GRANT SELECT ON public.collection_member_addresses_view TO authenticated;
GRANT SELECT ON public.office_member_addresses_view TO authenticated;

-- ============================================================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================================================

-- Test the member addresses view
SELECT 
    'Member Addresses View Test' as test_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT member_id) as unique_members,
    COUNT(*) FILTER (WHERE is_primary = true) as primary_addresses
FROM public.member_addresses_view;

-- Test the collection app view
SELECT 
    'Collection App View Test' as test_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT member_id) as unique_members,
    COUNT(*) FILTER (WHERE customer_status = 'active') as active_customers,
    COUNT(*) FILTER (WHERE customer_status = 'new_customer') as new_customers
FROM public.collection_member_addresses_view;

-- Test the office app view
SELECT 
    'Office App View Test' as test_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT member_id) as unique_members,
    COUNT(*) FILTER (WHERE total_pickups > 0) as addresses_with_pickups,
    COUNT(*) FILTER (WHERE wallet_balance > 0) as addresses_with_balance
FROM public.office_member_addresses_view;

-- Show sample data from each view
SELECT 
    'Sample Member Addresses' as test_type,
    member_id,
    full_name,
    formatted_address,
    is_primary,
    member_is_active
FROM public.member_addresses_view
LIMIT 5;

SELECT 
    'Sample Collection Addresses' as test_type,
    member_id,
    member_name,
    display_address,
    customer_status,
    total_collections
FROM public.collection_member_addresses_view
LIMIT 5;

SELECT 
    'Sample Office Addresses' as test_type,
    member_id,
    full_name,
    full_address,
    total_pickups,
    wallet_balance,
    tier
FROM public.office_member_addresses_view
LIMIT 5;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Member addresses check and views creation complete!
-- The following views have been created:
-- 1. member_addresses_view - Unified view for all member addresses
-- 2. member_addresses_with_pickups_view - Addresses with pickup statistics
-- 3. collection_member_addresses_view - Simplified view for collection app
-- 4. office_member_addresses_view - Comprehensive view for office app
-- 
-- These views use the current addresses table structure with customer_id
-- and provide formatted addresses for easy display in both apps.
