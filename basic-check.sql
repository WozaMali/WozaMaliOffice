-- Basic system check
SELECT 'Step 1: User profiles columns' as step;
SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND table_schema = 'public';

SELECT 'Step 2: Admin users' as step;
SELECT id, email, role FROM public.user_profiles WHERE role = 'admin';

SELECT 'Step 3: Pending pickups' as step;
SELECT id, collection_code, customer_name, status FROM public.unified_collections WHERE status = 'pending';

SELECT 'Step 4: Unified collections permissions' as step;
SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'unified_collections' AND table_schema = 'public';

SELECT 'Step 5: User wallets permissions' as step;
SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'user_wallets' AND table_schema = 'public';

SELECT 'Step 6: Wallet function' as step;
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'update_wallet_simple' AND routine_schema = 'public';
