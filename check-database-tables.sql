-- ============================================================================
-- CHECK DATABASE TABLE STRUCTURE
-- ============================================================================
-- Run this in your Supabase SQL Editor to see what tables actually exist
-- This will help us understand the correct table names

-- Check what tables exist in the public schema
SELECT 'Available Tables in Public Schema:' as info;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check table sizes and row counts
SELECT 'Table Row Counts:' as info;
SELECT 
  schemaname,
  tablename,
  n_tup_ins as rows_inserted,
  n_tup_upd as rows_updated,
  n_tup_del as rows_deleted,
  n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if specific tables exist
SELECT 'Checking for Pickup-Related Tables:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickups') 
    THEN '✅ pickups table exists'
    ELSE '❌ pickups table does not exist'
  END as pickups_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickup_items') 
    THEN '✅ pickup_items table exists'
    ELSE '❌ pickup_items table does not exist'
  END as pickup_items_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickup_photos') 
    THEN '✅ pickup_photos table exists'
    ELSE '❌ pickup_photos table does not exist'
  END as pickup_photos_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') 
    THEN '✅ payments table exists'
    ELSE '❌ payments table does not exist'
  END as payments_status;

-- Check table columns for pickup-related tables
SELECT 'Pickup Table Structure:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('pickups', 'pickup_items', 'pickup_photos')
ORDER BY table_name, ordinal_position;

-- Check for any pickup-related data
SELECT 'Current Pickup Data:' as info;
SELECT 
  'pickups' as table_name,
  COUNT(*) as record_count
FROM public.pickups
UNION ALL
SELECT 
  'pickup_items' as table_name,
  COUNT(*) as record_count
FROM public.pickup_items
UNION ALL
SELECT 
  'pickup_photos' as table_name,
  COUNT(*) as record_count
FROM public.pickup_photos;
