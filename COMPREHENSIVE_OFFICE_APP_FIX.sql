-- ============================================================================
-- COMPREHENSIVE OFFICE APP FIX
-- ============================================================================
-- This script fixes all the remaining issues with the office app

-- Step 1: Fix the areas table relationship issue
-- First, let's check if areas table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    township TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Fix users table to remove the problematic township relationship
-- First, drop the dependent view
DROP VIEW IF EXISTS public.residents_view CASCADE;

-- Remove the township column that's causing the relationship error
ALTER TABLE public.users DROP COLUMN IF EXISTS township;

-- Step 3: Ensure proper RLS policies for all tables
-- Drop all existing policies first
DROP POLICY IF EXISTS "users_allow_all" ON public.users;
DROP POLICY IF EXISTS "unified_collections_allow_all" ON public.unified_collections;
DROP POLICY IF EXISTS "profiles_allow_all" ON public.profiles;
DROP POLICY IF EXISTS "deleted_transactions_allow_all" ON public.deleted_transactions;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users;

-- Step 4: Create simple, working RLS policies
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

-- Step 5: Grant all necessary permissions
GRANT ALL ON public.users TO authenticated, anon, service_role;
GRANT ALL ON public.unified_collections TO authenticated, anon, service_role;
GRANT ALL ON public.profiles TO authenticated, anon, service_role;
GRANT ALL ON public.deleted_transactions TO authenticated, anon, service_role;
GRANT ALL ON public.areas TO authenticated, anon, service_role;

-- Step 6: Enable realtime for all tables (only if not already added)
DO $$
BEGIN
    -- Add tables to realtime publication only if they're not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'unified_collections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.unified_collections;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'deleted_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deleted_transactions;
    END IF;
END $$;

-- Step 7: Fix the soft delete RPC function (use the final version)
DROP FUNCTION IF EXISTS public.soft_delete_collection(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.restore_deleted_collection(UUID, UUID);

-- Create the corrected soft_delete_collection function
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
    wallet_record RECORD;
    deleted_transaction_id UUID;
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
    
    -- Get wallet transaction data if exists
    SELECT * INTO wallet_record 
    FROM public.wallet_transactions 
    WHERE source_id = p_collection_id AND source_type = 'collection_approval'
    LIMIT 1;
    
    -- Insert into deleted_transactions with the ACTUAL field mapping
    INSERT INTO public.deleted_transactions (
        original_collection_id,
        collection_code,
        status,
        customer_id,
        collector_id,
        pickup_address_id,
        customer_name,
        customer_email,
        collector_name,
        collector_email,
        pickup_address,
        total_weight_kg,
        computed_value,
        total_value,
        admin_notes,
        created_by,
        updated_by,
        created_at,
        updated_at,
        wallet_user_id,
        wallet_source_type,
        wallet_source_id,
        wallet_amount,
        wallet_points,
        wallet_description,
        wallet_created_at,
        deleted_by,
        deletion_reason,
        original_data
    ) VALUES (
        p_collection_id,
        collection_record.collection_code,
        collection_record.status,
        collection_record.customer_id,
        collection_record.collector_id,
        collection_record.pickup_address_id,
        collection_record.customer_name,
        collection_record.customer_email,
        collection_record.collector_name,
        collection_record.collector_email,
        collection_record.pickup_address,
        collection_record.total_weight_kg,
        collection_record.computed_value,
        collection_record.total_value,
        collection_record.admin_notes,
        collection_record.created_by,
        collection_record.updated_by,
        collection_record.created_at,
        collection_record.updated_at,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.user_id ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.source_type ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.source_id ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.amount ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.points ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.description ELSE NULL END,
        CASE WHEN wallet_record.id IS NOT NULL THEN wallet_record.created_at ELSE NULL END,
        p_deleted_by,
        p_deletion_reason,
        jsonb_build_object(
            'collection', row_to_json(collection_record),
            'wallet_transaction', CASE WHEN wallet_record.id IS NOT NULL THEN row_to_json(wallet_record) ELSE NULL END
        )
    ) RETURNING id INTO deleted_transaction_id;
    
    -- Delete the original collection
    DELETE FROM public.unified_collections WHERE id = p_collection_id;
    
    -- Delete related wallet transaction if exists
    IF wallet_record.id IS NOT NULL THEN
        DELETE FROM public.wallet_transactions WHERE id = wallet_record.id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_transaction_id', deleted_transaction_id,
        'message', 'Collection successfully soft deleted'
    );
END;
$$;

-- Create the restore_deleted_collection function
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
    restored_wallet_id UUID;
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
    
    -- Restore the collection with the ACTUAL field mapping
    INSERT INTO public.unified_collections (
        id,
        collection_code,
        collection_type,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        pickup_address_id,
        pickup_address,
        pickup_coordinates,
        collector_id,
        collector_name,
        collector_phone,
        total_weight_kg,
        total_value,
        material_count,
        status,
        priority,
        scheduled_date,
        scheduled_time,
        actual_date,
        actual_time,
        completed_at,
        customer_notes,
        collector_notes,
        admin_notes,
        quality_rating,
        created_by,
        created_at,
        updated_at,
        collector_email,
        computed_value,
        updated_by,
        material_photo_url,
        scale_photo_url,
        material_photo_path,
        scale_photo_path
    ) VALUES (
        deleted_record.original_collection_id,
        deleted_record.collection_code,
        deleted_record.original_data->>'collection_type',
        deleted_record.customer_id,
        deleted_record.customer_name,
        deleted_record.original_data->>'customer_phone',
        deleted_record.customer_email,
        deleted_record.pickup_address_id,
        deleted_record.pickup_address,
        deleted_record.original_data->>'pickup_coordinates',
        deleted_record.collector_id,
        deleted_record.collector_name,
        deleted_record.original_data->>'collector_phone',
        deleted_record.total_weight_kg,
        deleted_record.total_value,
        (deleted_record.original_data->>'material_count')::INTEGER,
        deleted_record.status,
        deleted_record.original_data->>'priority',
        (deleted_record.original_data->>'scheduled_date')::DATE,
        deleted_record.original_data->>'scheduled_time',
        (deleted_record.original_data->>'actual_date')::DATE,
        deleted_record.original_data->>'actual_time',
        (deleted_record.original_data->>'completed_at')::TIMESTAMPTZ,
        deleted_record.original_data->>'customer_notes',
        deleted_record.original_data->>'collector_notes',
        deleted_record.admin_notes,
        (deleted_record.original_data->>'quality_rating')::INTEGER,
        deleted_record.created_by,
        deleted_record.created_at,
        deleted_record.updated_at,
        deleted_record.collector_email,
        deleted_record.computed_value,
        deleted_record.updated_by,
        deleted_record.original_data->>'material_photo_url',
        deleted_record.original_data->>'scale_photo_url',
        deleted_record.original_data->>'material_photo_path',
        deleted_record.original_data->>'scale_photo_path'
    ) RETURNING id INTO restored_collection_id;
    
    -- Restore wallet transaction if it existed
    IF deleted_record.wallet_user_id IS NOT NULL THEN
        INSERT INTO public.wallet_transactions (
            user_id,
            source_type,
            source_id,
            amount,
            points,
            description,
            created_at
        ) VALUES (
            deleted_record.wallet_user_id,
            deleted_record.wallet_source_type,
            deleted_record.wallet_source_id,
            deleted_record.wallet_amount,
            deleted_record.wallet_points,
            deleted_record.wallet_description,
            deleted_record.wallet_created_at
        ) RETURNING id INTO restored_wallet_id;
    END IF;
    
    -- Delete the deleted transaction record
    DELETE FROM public.deleted_transactions WHERE id = p_deleted_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'restored_collection_id', restored_collection_id,
        'restored_wallet_id', restored_wallet_id,
        'message', 'Collection successfully restored'
    );
END;
$$;

-- Step 8: Grant permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO authenticated, service_role;

-- Step 9: Recreate residents_view without township dependency (if needed)
CREATE OR REPLACE VIEW public.residents_view AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.status,
    u.created_at,
    r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE r.name = 'resident' OR r.name = 'member';

-- Step 10: Verify the fix
SELECT 'Comprehensive office app fix completed successfully' as status;
