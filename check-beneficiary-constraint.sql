-- Check the beneficiary_type constraint
SELECT 'Beneficiary Type Constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%beneficiary_type%'
AND conrelid = 'green_scholar_transactions'::regclass;

-- Check what beneficiary types are allowed
SELECT 'Allowed Beneficiary Types:' as info;
SELECT DISTINCT beneficiary_type 
FROM green_scholar_transactions 
WHERE beneficiary_type IS NOT NULL;
