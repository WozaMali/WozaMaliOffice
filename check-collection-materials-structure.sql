-- Check the structure of collection_materials table
SELECT 'Collection materials table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'collection_materials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists in collection_materials
SELECT 'Sample collection_materials data:' as info;
SELECT * FROM public.collection_materials LIMIT 5;
