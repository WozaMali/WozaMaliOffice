-- Check points_transactions table structure
SELECT 'Points transactions table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'points_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what data exists in points_transactions
SELECT 'Sample points_transactions data:' as info;
SELECT * FROM public.points_transactions LIMIT 5;
