-- ============================================================================
-- ADD TEST DATA WITH PROPER SUPABASE AUTH
-- ============================================================================
-- This script works with your existing auth system
-- Run this in your Supabase SQL Editor

-- First, let's see what users we currently have
SELECT id, email, full_name, role FROM public.profiles ORDER BY role, email;

-- Let's check if we can work with existing users instead of creating new ones
-- This is safer and won't violate foreign key constraints

-- Option 1: Use existing users and just update their roles if needed
-- (This is the safest approach)

-- Let's see what existing users we can work with
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  CASE 
    WHEN p.role = 'collector' THEN 'Can use as collector'
    WHEN p.role = 'member' THEN 'Can use as customer'
    WHEN p.role = 'admin' THEN 'Can use as admin'
    ELSE 'Check if role is valid'
  END as usage_note
FROM public.profiles p
ORDER BY p.role, p.email;

-- Option 2: If you want to create new auth users, you need to do it through Supabase Auth
-- (This requires using the Supabase dashboard or auth API, not direct SQL)

-- For now, let's work with existing users and create test data
-- Let's find a user with 'collector' role to use for testing
SELECT 
  p.id as collector_id,
  p.email as collector_email,
  p.full_name as collector_name
FROM public.profiles p
WHERE p.role = 'collector'
LIMIT 1;

-- Let's find a user with 'member' role to use as customer
SELECT 
  p.id as customer_id,
  p.email as customer_email,
  p.full_name as customer_name
FROM public.profiles p
WHERE p.role = 'member'
LIMIT 1;

-- Let's check if we have addresses for existing users
SELECT 
  a.id as address_id,
  a.profile_id,
  p.email as user_email,
  p.role as user_role,
  a.line1,
  a.suburb,
  a.city
FROM public.addresses a
JOIN public.profiles p ON a.profile_id = p.id
ORDER BY p.role, p.email;

-- Now let's create test pickups using existing users (if we have them)
-- We'll use a conditional approach to avoid errors

DO $$
DECLARE
  collector_uuid UUID;
  customer_uuid UUID;
  address_uuid UUID;
BEGIN
  -- Get a collector
  SELECT id INTO collector_uuid 
  FROM public.profiles 
  WHERE role = 'collector' 
  LIMIT 1;
  
  -- Get a customer/member
  SELECT id INTO customer_uuid 
  FROM public.profiles 
  WHERE role = 'member' 
  LIMIT 1;
  
  -- Get an address for the customer
  SELECT a.id INTO address_uuid 
  FROM public.addresses a
  JOIN public.profiles p ON a.profile_id = p.id
  WHERE p.role = 'member'
  LIMIT 1;
  
  -- Only create test data if we have all required users
  IF collector_uuid IS NOT NULL AND customer_uuid IS NOT NULL AND address_uuid IS NOT NULL THEN
    
    -- Create a test pickup
    INSERT INTO public.pickups (id, customer_id, collector_id, address_id, status)
    VALUES (
      uuid_generate_v4(),
      customer_uuid,
      collector_uuid,
      address_uuid,
      'submitted'
    );
    
    RAISE NOTICE 'Test pickup created successfully!';
    
  ELSE
    RAISE NOTICE 'Cannot create test data - missing required users or addresses';
    RAISE NOTICE 'Collector: %, Customer: %, Address: %', 
      collector_uuid, customer_uuid, address_uuid;
  END IF;
  
END $$;

-- Show what we have now
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

-- Show any pickups we created
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
JOIN public.addresses a ON p.address_id = a.id;
