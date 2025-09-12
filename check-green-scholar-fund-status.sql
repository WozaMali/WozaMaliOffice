-- Check Green Scholar Fund status and recent transactions
SELECT 'Green Scholar Fund Balance:' as info;
SELECT 
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    last_updated
FROM green_scholar_fund_balance;

-- Check recent Green Scholar transactions
SELECT 'Recent Green Scholar Transactions:' as info;
SELECT 
    transaction_type,
    source_type,
    amount,
    description,
    donor_name,
    donor_email,
    beneficiary_type,
    status,
    created_at
FROM green_scholar_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Check Legacy Music's collections and their contributions
SELECT 'Legacy Music Collections and Contributions:' as info;
SELECT 
    uc.collection_code,
    uc.customer_name,
    uc.total_value,
    uc.status,
    uc.created_at,
    COALESCE(SUM(cgc.green_scholar_contribution), 0) as green_scholar_total,
    COALESCE(SUM(cgc.user_wallet_contribution), 0) as user_wallet_total
FROM unified_collections uc
LEFT JOIN collection_green_scholar_contributions cgc ON uc.id = cgc.collection_id
WHERE uc.customer_name = 'Legacy Music'
GROUP BY uc.id, uc.collection_code, uc.customer_name, uc.total_value, uc.status, uc.created_at
ORDER BY uc.created_at DESC;

-- Check specific material contributions for Legacy Music
SELECT 'Legacy Music Material Contributions:' as info;
SELECT 
    uc.collection_code,
    cgc.material_name,
    cgc.weight_kg,
    cgc.total_value,
    cgc.green_scholar_contribution,
    cgc.user_wallet_contribution
FROM unified_collections uc
JOIN collection_green_scholar_contributions cgc ON uc.id = cgc.collection_id
WHERE uc.customer_name = 'Legacy Music'
ORDER BY uc.created_at DESC, cgc.material_name;
