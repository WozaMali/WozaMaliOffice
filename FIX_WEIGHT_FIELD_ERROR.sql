-- ============================================================================
-- FIX WEIGHT FIELD ERROR IN SOFT DELETE FUNCTION
-- ============================================================================
-- This script fixes the "record v_collection has no field weight_kg" error
-- The issue is that the function tries to access v_collection.weight_kg
-- but the actual field names vary between tables

CREATE OR REPLACE FUNCTION public.soft_delete_collection(
  p_collection_id uuid,
  p_deleted_by uuid,
  p_deletion_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection RECORD;
  v_deleted_id uuid;
  v_original_data jsonb;
  v_table_exists boolean := false;
  v_customer_id uuid;
  v_weight_kg numeric(10,2) := 0;
  v_total_value numeric(12,2) := 0;
BEGIN
  -- Verify the user has admin or super_admin role
  -- Check the users.role column instead of user_roles table
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Check if unified_collections table exists and has data
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'unified_collections'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
      SELECT * INTO v_collection FROM public.unified_collections WHERE id = p_collection_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_table_exists := false;
  END;

  -- If not found in unified_collections, try collections table
  IF NOT FOUND OR NOT v_table_exists THEN
    SELECT * INTO v_collection FROM public.collections WHERE id = p_collection_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Collection not found');
    END IF;
  END IF;

  -- Determine customer_id based on table structure
  IF v_table_exists THEN
    v_customer_id := v_collection.customer_id;
  ELSE
    v_customer_id := v_collection.user_id;
  END IF;

  -- Extract weight and value fields safely based on table structure
  -- For unified_collections: use total_weight_kg and total_value
  -- For collections: use weight_kg and computed_value
  IF v_table_exists THEN
    v_weight_kg := COALESCE(v_collection.total_weight_kg, 0);
    v_total_value := COALESCE(v_collection.total_value, v_collection.computed_value, 0);
  ELSE
    v_weight_kg := COALESCE(v_collection.weight_kg, v_collection.total_kg, 0);
    v_total_value := COALESCE(v_collection.computed_value, v_collection.total_value, 0);
  END IF;

  -- Prepare original data for audit trail
  v_original_data := jsonb_build_object(
    'collection', row_to_json(v_collection),
    'source_table', CASE WHEN v_table_exists THEN 'unified_collections' ELSE 'collections' END
  );

  -- Insert into deleted_transactions table
  INSERT INTO public.deleted_transactions (
    original_collection_id,
    collection_code,
    status,
    customer_id,
    collector_id,
    weight_kg,
    total_value,
    deleted_by,
    deletion_reason,
    original_data
  ) VALUES (
    v_collection.id,
    COALESCE(v_collection.collection_code, ''),
    v_collection.status,
    v_customer_id,
    v_collection.collector_id,
    v_weight_kg,
    v_total_value,
    p_deleted_by,
    p_deletion_reason,
    v_original_data
  ) RETURNING id INTO v_deleted_id;

  -- Delete from the original table
  IF v_table_exists THEN
    DELETE FROM public.unified_collections WHERE id = p_collection_id;
  ELSE
    DELETE FROM public.collections WHERE id = p_collection_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Collection successfully moved to deleted transactions',
    'deleted_transaction_id', v_deleted_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(uuid, uuid, text) TO authenticated;

SELECT 'Weight field error fixed!' as result;
