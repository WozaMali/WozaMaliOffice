-- ============================================================================
-- FIX CREATED_AT CONSTRAINT ERROR IN SOFT DELETE FUNCTION
-- ============================================================================
-- This script fixes the "null value in column created_at violates not-null constraint" error
-- by ensuring the created_at field is properly set when inserting into deleted_transactions

-- First, let's check and fix the deleted_transactions table structure
CREATE TABLE IF NOT EXISTS public.deleted_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_collection_id uuid NOT NULL,
  collection_code text,
  status text NOT NULL,
  customer_id uuid,
  collector_id uuid,
  weight_kg numeric(10,2),
  total_value numeric(12,2),
  deleted_by uuid NOT NULL,
  deletion_reason text,
  original_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update the soft_delete_collection function to explicitly set created_at
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
  v_collection_code text := '';
  v_status text := '';
  v_collector_id uuid;
  v_current_time timestamptz := now();
BEGIN
  -- Verify the user has admin or super_admin role
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

  -- Extract fields safely based on table structure
  IF v_table_exists THEN
    -- unified_collections table structure
    v_customer_id := v_collection.customer_id;
    v_weight_kg := COALESCE(v_collection.total_weight_kg, 0);
    v_total_value := COALESCE(v_collection.total_value, 0);
    v_collection_code := COALESCE(v_collection.collection_code, '');
    v_status := COALESCE(v_collection.status, '');
    v_collector_id := v_collection.collector_id;
  ELSE
    -- collections table structure
    v_customer_id := v_collection.user_id;
    v_weight_kg := COALESCE(v_collection.weight_kg, v_collection.total_kg, 0);
    v_total_value := COALESCE(v_collection.computed_value, v_collection.total_value, 0);
    v_collection_code := COALESCE(v_collection.collection_code, '');
    v_status := COALESCE(v_collection.status, '');
    v_collector_id := v_collection.collector_id;
  END IF;

  -- Prepare original data for audit trail
  v_original_data := jsonb_build_object(
    'collection', row_to_json(v_collection),
    'source_table', CASE WHEN v_table_exists THEN 'unified_collections' ELSE 'collections' END
  );

  -- Insert into deleted_transactions table with explicit created_at and updated_at
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
    original_data,
    created_at,
    updated_at
  ) VALUES (
    v_collection.id,
    v_collection_code,
    v_status,
    v_customer_id,
    v_collector_id,
    v_weight_kg,
    v_total_value,
    p_deleted_by,
    p_deletion_reason,
    v_original_data,
    v_current_time,
    v_current_time
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

-- Create indexes for efficient querying if they don't exist
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_original_collection_id 
ON public.deleted_transactions(original_collection_id);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_deleted_by 
ON public.deleted_transactions(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_created_at 
ON public.deleted_transactions(created_at);

-- Enable RLS if not already enabled
ALTER TABLE public.deleted_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policy for super admins to see all deleted transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'deleted_transactions' 
    AND policyname = 'Super admins can view all deleted transactions'
  ) THEN
    CREATE POLICY "Super admins can view all deleted transactions" ON public.deleted_transactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'super_admin'
        )
      );
  END IF;

  -- Policy for admins to see deleted transactions they created
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'deleted_transactions' 
    AND policyname = 'Admins can view their deleted transactions'
  ) THEN
    CREATE POLICY "Admins can view their deleted transactions" ON public.deleted_transactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'admin'
        ) AND deleted_by = auth.uid()
      );
  END IF;
END $$;

SELECT 'Created_at constraint error fixed successfully!' as result;
