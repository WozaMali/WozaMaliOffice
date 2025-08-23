-- ============================================================================
-- CHECK EXISTING USERS AND ROLES
-- ============================================================================
-- Run this in your Supabase SQL Editor to see what users you have

-- Show all profiles with their roles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
ORDER BY role, email;

-- Count users by role
SELECT 
  role,
  COUNT(*) as user_count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- Check if we have users with collector and member roles
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'collector') 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_collectors,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'member') 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_members,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') 
    THEN 'Yes' 
    ELSE 'No' 
  END as has_admins;

-- Show users that could be used as collectors
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE role = 'collector';

-- Show users that could be used as customers
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE role = 'member';
