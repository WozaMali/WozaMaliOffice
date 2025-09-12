-- Check points_transactions table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'points_transactions' AND table_schema = 'public' ORDER BY ordinal_position;
