-- Check the updated values
SELECT 'Pending collections with updated values:' as info;
SELECT 
    id,
    collection_code,
    customer_name,
    status,
    total_weight_kg,
    total_value,
    created_at
FROM public.unified_collections
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Check the materials with their prices
SELECT 'Collection materials with prices:' as info;
SELECT 
    uc.collection_code,
    cm.material_name,
    cm.quantity,
    cm.unit_price,
    cm.total_price
FROM public.unified_collections uc
JOIN public.collection_materials cm ON uc.id = cm.collection_id
WHERE uc.status = 'pending'
ORDER BY uc.created_at DESC, cm.material_name;
