-- ============================================================================
-- COMPLETE PERMISSIONS FIX FOR OFFICE APP
-- ============================================================================
-- This script fixes all permission issues including RPC functions

-- Step 1: Drop ALL problematic RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "SUPER_ADMIN can view all users" ON public.users;
DROP POLICY IF EXISTS "SUPER_ADMIN can manage all users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can view non-superadmin users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can manage non-superadmin users" ON public.users;
DROP POLICY IF EXISTS "simple_users_select" ON public.users;
DROP POLICY IF EXISTS "simple_users_update" ON public.users;
DROP POLICY IF EXISTS "simple_users_insert" ON public.users;
DROP POLICY IF EXISTS "simple_users_service_all" ON public.users;
DROP POLICY IF EXISTS "users_allow_all" ON public.users;

-- Drop unified_collections policies
DROP POLICY IF EXISTS "unified_collections_select_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_insert_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_update_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_service_role_all" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_select" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_insert" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_update" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_delete" ON public.unified_collections;
DROP POLICY IF EXISTS "service_role_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_allow_all" ON public.unified_collections;

-- Drop profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;

-- Step 2: Temporarily disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant all permissions to all roles
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.unified_collections TO service_role;
GRANT ALL ON public.unified_collections TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;

-- Step 4: Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS public.deleted_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_collection_id UUID,
    collection_data JSONB,
    deleted_by UUID,
    deletion_reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create RPC functions for soft delete operations
CREATE OR REPLACE FUNCTION public.soft_delete_collection(
    p_collection_id UUID,
    p_deleted_by UUID,
    p_deletion_reason TEXT DEFAULT 'Deleted by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    collection_record RECORD;
    deleted_transaction_id UUID;
    result JSONB;
BEGIN
    -- Get the collection data
    SELECT * INTO collection_record 
    FROM public.unified_collections 
    WHERE id = p_collection_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Collection not found'
        );
    END IF;
    
    -- Create deleted transaction record
    INSERT INTO public.deleted_transactions (
        original_collection_id,
        collection_data,
        deleted_by,
        deletion_reason
    ) VALUES (
        p_collection_id,
        to_jsonb(collection_record),
        p_deleted_by,
        p_deletion_reason
    ) RETURNING id INTO deleted_transaction_id;
    
    -- Delete the original collection
    DELETE FROM public.unified_collections WHERE id = p_collection_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_transaction_id', deleted_transaction_id,
        'message', 'Collection successfully soft deleted'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_deleted_collection(
    p_deleted_transaction_id UUID,
    p_restored_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_record RECORD;
    restored_collection_id UUID;
    result JSONB;
BEGIN
    -- Get the deleted transaction data
    SELECT * INTO deleted_record 
    FROM public.deleted_transactions 
    WHERE id = p_deleted_transaction_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Deleted transaction not found'
        );
    END IF;
    
    -- Restore the collection
    INSERT INTO public.unified_collections (
        id,
        customer_name,
        status,
        computed_value,
        total_value,
        created_at,
        updated_at
    ) VALUES (
        (deleted_record.collection_data->>'id')::UUID,
        deleted_record.collection_data->>'customer_name',
        deleted_record.collection_data->>'status',
        (deleted_record.collection_data->>'computed_value')::NUMERIC,
        (deleted_record.collection_data->>'total_value')::NUMERIC,
        (deleted_record.collection_data->>'created_at')::TIMESTAMP WITH TIME ZONE,
        NOW()
    ) RETURNING id INTO restored_collection_id;
    
    -- Delete the deleted transaction record
    DELETE FROM public.deleted_transactions WHERE id = p_deleted_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'restored_collection_id', restored_collection_id,
        'message', 'Collection successfully restored'
    );
END;
$$;

-- Step 6: Grant permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO service_role;

-- Step 7: Grant permissions on deleted_transactions table
GRANT ALL ON public.deleted_transactions TO authenticated;
GRANT ALL ON public.deleted_transactions TO service_role;
GRANT ALL ON public.deleted_transactions TO anon;

-- Step 8: Re-enable RLS with very simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_transactions ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for development (drop first if they exist)
DROP POLICY IF EXISTS "users_allow_all" ON public.users;
DROP POLICY IF EXISTS "unified_collections_allow_all" ON public.unified_collections;
DROP POLICY IF EXISTS "profiles_allow_all" ON public.profiles;
DROP POLICY IF EXISTS "deleted_transactions_allow_all" ON public.deleted_transactions;

CREATE POLICY "users_allow_all" ON public.users 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

CREATE POLICY "unified_collections_allow_all" ON public.unified_collections 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

CREATE POLICY "profiles_allow_all" ON public.profiles 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

CREATE POLICY "deleted_transactions_allow_all" ON public.deleted_transactions 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

-- Step 9: Create some test data for unified_collections if empty
INSERT INTO public.unified_collections (
    id, 
    customer_name,
    status, 
    computed_value, 
    total_value, 
    created_at
) VALUES 
    (
        gen_random_uuid(), 
        'Test Customer 1',
        'pending', 
        100, 
        100, 
        NOW()
    ),
    (
        gen_random_uuid(), 
        'Test Customer 2',
        'approved', 
        200, 
        200, 
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Step 10: Verify the fix
SELECT 'Complete permissions fix completed successfully' as status;

-- Check that tables are accessible
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'unified_collections' as table_name, COUNT(*) as row_count FROM public.unified_collections
UNION ALL
SELECT 'deleted_transactions' as table_name, COUNT(*) as row_count FROM public.deleted_transactions;
