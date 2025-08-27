-- Check Dumisani's current role and profile information
SELECT 
  id,
  email,
  full_name,
  phone,
  role,
  is_active,
  created_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';

-- Also check if there are any profiles with similar emails
SELECT 
  id,
  email,
  full_name,
  phone,
  role,
  is_active,
  created_at
FROM profiles 
WHERE email LIKE '%dumisani%' OR email LIKE '%wozamali%';

-- Check what roles exist in the system
SELECT DISTINCT role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;
