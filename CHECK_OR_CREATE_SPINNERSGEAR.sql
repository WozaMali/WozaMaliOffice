-- Check if Spinners Gear Magazine user exists anywhere
SELECT 'Checking for Spinners Gear Magazine user:' as info;

-- Check in users table
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'd2eb9cbe-b2d0-41d3-aa2c-06e8a48f9324'
   OR u.email = 'spinnersgear1020@gmail.com'
   OR u.full_name ILIKE '%Spinners Gear%';

-- If user doesn't exist, create them
INSERT INTO public.users (
    id,
    email,
    full_name,
    status,
    role_id,
    created_at,
    updated_at
) VALUES (
    'd2eb9cbe-b2d0-41d3-aa2c-06e8a48f9324',
    'spinnersgear1020@gmail.com',
    'Spinners Gear Magazine',
    'active',
    (SELECT id FROM public.roles WHERE name = 'resident'),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was created/updated
SELECT 'User after creation/update:' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    r.name as role_name,
    u.status
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'd2eb9cbe-b2d0-41d3-aa2c-06e8a48f9324';
