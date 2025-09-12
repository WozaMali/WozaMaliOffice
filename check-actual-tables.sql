-- Check what tables actually exist
SELECT 'Existing Tables:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%green%' OR table_name LIKE '%scholar%'
ORDER BY table_name;

-- Check if the trigger function exists
SELECT 'Green Scholar Functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%green%' OR routine_name LIKE '%scholar%';

-- Check Legacy Music's collections
SELECT 'Legacy Music Collections:' as info;
SELECT 
    collection_code,
    customer_name,
    total_value,
    status,
    created_at
FROM unified_collections 
WHERE customer_name = 'Legacy Music'
ORDER BY created_at DESC;

-- Check collection materials for Legacy Music
SELECT 'Legacy Music Collection Materials:' as info;
SELECT 
    uc.collection_code,
    cm.material_name,
    cm.quantity,
    cm.unit_price,
    cm.total_price
FROM unified_collections uc
JOIN collection_materials cm ON uc.id = cm.collection_id
WHERE uc.customer_name = 'Legacy Music'
ORDER BY uc.created_at DESC, cm.material_name;
