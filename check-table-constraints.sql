-- Check all constraints on green_scholar_transactions table
SELECT 'All Constraints on green_scholar_transactions:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'green_scholar_transactions'::regclass
ORDER BY conname;
