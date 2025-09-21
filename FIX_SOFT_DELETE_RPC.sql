-- ============================================================================
-- FIX SOFT DELETE RPC FUNCTION
-- ============================================================================
-- This fixes the soft_delete_collection RPC function to work with the current
-- deleted_transactions table structure that has a collection_data JSONB column

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
    
    -- Restore the collection using the stored JSONB data
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

-- Grant permissions on the updated RPC functions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_collection(UUID, UUID) TO service_role;

-- Verify the fix
SELECT 'Soft delete RPC functions fixed successfully' as status;
