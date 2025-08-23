-- ============================================================================
-- ADD TEST DATA USING EXISTING ROLES
-- ============================================================================
-- This script adds test data using the roles your system already supports:
-- member, admin, collector
-- Run this in your Supabase SQL Editor

-- First, let's see what users we currently have
SELECT id, email, full_name, role FROM public.profiles ORDER BY role, email;

-- Add a test collector if one doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test-collector@wozamali.com',
  'Test Collector',
  'collector'
) ON CONFLICT (id) DO NOTHING;

-- Add a test customer/member if one doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'test-customer@wozamali.com',
  'Test Customer',
  'member'
) ON CONFLICT (id) DO NOTHING;

-- Add a test address for the customer if one doesn't exist
INSERT INTO public.addresses (id, profile_id, line1, suburb, city, postal_code)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '123 Test Street',
  'Test Suburb',
  'Test City',
  '1234'
) ON CONFLICT (id) DO NOTHING;

-- Now let's create a test pickup using the existing users
INSERT INTO public.pickups (id, customer_id, collector_id, address_id, status)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222', -- test customer
  '11111111-1111-1111-1111-111111111111', -- test collector
  '33333333-3333-3333-3333-333333333333', -- test address
  'submitted'
) ON CONFLICT (id) DO NOTHING;

-- Add some test pickup items
INSERT INTO public.pickup_items (id, pickup_id, material_id, kilograms, contamination_pct)
SELECT 
  uuid_generate_v4(),
  '44444444-4444-4444-4444-444444444444',
  m.id,
  5.5, -- 5.5 kg
  2.0  -- 2% contamination
FROM public.materials m
WHERE m.name = 'PET Bottles'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify what we created
SELECT 
  'Profiles' as table_name,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Addresses' as table_name,
  COUNT(*) as count
FROM public.addresses
UNION ALL
SELECT 
  'Pickups' as table_name,
  COUNT(*) as count
FROM public.pickups
UNION ALL
SELECT 
  'Pickup Items' as table_name,
  COUNT(*) as count
FROM public.pickup_items;

-- Show the test pickup data
SELECT 
  p.id as pickup_id,
  c.email as customer_email,
  c.full_name as customer_name,
  col.email as collector_email,
  col.full_name as collector_name,
  a.line1 as address,
  p.status,
  p.started_at
FROM public.pickups p
JOIN public.profiles c ON p.customer_id = c.id
JOIN public.profiles col ON p.collector_id = col.id
JOIN public.addresses a ON p.address_id = a.id
WHERE p.id = '44444444-4444-4444-4444-444444444444';
