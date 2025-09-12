-- Check the actual structure of green_scholar_transactions table
SELECT 'Green Scholar Transactions Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'green_scholar_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the table exists and what's in it
SELECT 'Green Scholar Transactions Data:' as info;
SELECT * FROM green_scholar_transactions LIMIT 5;
