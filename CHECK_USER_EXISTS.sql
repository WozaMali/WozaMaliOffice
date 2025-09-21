-- Check if user exists in the database
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status,
    u.created_at
FROM public.users u
WHERE u.id = 'd2eb9cbe-b2d0-41d3-aa2c-06e8a48f9324';

-- If no results, show all user IDs to help find the correct one
SELECT 'All user IDs in database:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 10;
