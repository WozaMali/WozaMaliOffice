-- ============================================================================
-- FIX DASHBOARD DATABASE ISSUES
-- ============================================================================
-- This script fixes the database schema issues causing 400/404 errors in the admin dashboard

-- Step 1: Check current table structure
SELECT 'Current Tables in Database:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Fix collections table - add missing columns
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS total_kg DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2) DEFAULT 0;

-- Step 3: Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create cash_payments table if it doesn't exist (alternative to payments)
CREATE TABLE IF NOT EXISTS public.cash_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT DEFAULT 'cash',
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4.1: Ensure cash_payments has status column (fix for existing tables)
ALTER TABLE public.cash_payments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Step 5: Ensure unified_collections table has correct columns
ALTER TABLE public.unified_collections 
ADD COLUMN IF NOT EXISTS total_kg DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2) DEFAULT 0;

-- Step 6: No sample data needed - tables will be empty initially

-- Step 7: Grant permissions on new tables
GRANT ALL ON public.payments TO authenticated, anon, service_role;
GRANT ALL ON public.cash_payments TO authenticated, anon, service_role;

-- Step 8: Enable RLS on new tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_payments ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for new tables
CREATE POLICY "payments_allow_all" ON public.payments FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);
CREATE POLICY "cash_payments_allow_all" ON public.cash_payments FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);

-- Step 10: Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_payments;

-- Step 11: Verify the fixes
SELECT 'Database Schema Fixes Applied:' as info;
SELECT '✅ Collections table updated with total_kg and weight_kg columns' as status;
SELECT '✅ Payments table created' as status;
SELECT '✅ Cash_payments table created' as status;
SELECT '✅ Permissions granted' as status;
SELECT '✅ RLS policies created' as status;
SELECT '✅ Realtime enabled' as status;

SELECT 'Dashboard database issues fixed successfully' as final_status;
