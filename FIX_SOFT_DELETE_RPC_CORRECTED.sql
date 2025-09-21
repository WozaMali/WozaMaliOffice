-- ============================================================================
-- FIX SOFT DELETE RPC FUNCTION - CORRECTED VERSION
-- ============================================================================
-- This fixes the soft_delete_collection RPC function to work with the actual
-- unified_collections table structure

-- Drop and recreate the soft_delete_collection function
DROP FUNCTION IF EXISTS public.soft_delete_collection(UUID, UUID, TEXT);

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
    
    -- Insert into deleted_transactions with the correct field mapping
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
        weight_kg,
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
        collection_record.weight_kg,
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

-- Drop and recreate the restore_deleted_collection function
DROP FUNCTION IF EXISTS public.restore_deleted_collection(UUID, UUID);

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
    
    -- Restore the collection with the correct field mapping
    INSERT INTO public.unified_collections (
        id,
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
        weight_kg,
        total_weight_kg,
        computed_value,
        total_value,
        admin_notes,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        deleted_record.original_collection_id,
        deleted_record.collection_code,
        deleted_record.status,
        deleted_record.customer_id,
        deleted_record.collector_id,
        deleted_record.pickup_address_id,
        deleted_record.customer_name,
        deleted_record.customer_email,
        deleted_record.collector_name,
        deleted_record.collector_email,
        deleted_record.pickup_address,
        deleted_record.weight_kg,
        deleted_record.total_weight_kg,
        deleted_record.computed_value,
        deleted_record.total_value,
        deleted_record.admin_notes,
        deleted_record.created_by,
        deleted_record.updated_by,
        deleted_record.created_at,
        deleted_record.updated_at
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

-- Grant permissions on the updated RPC functions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO service_role;

-- Verify the fix
SELECT 'Soft delete RPC functions corrected successfully' as status;
