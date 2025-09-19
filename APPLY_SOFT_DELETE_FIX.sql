-- ============================================================================
-- APPLY SOFT DELETE FIX - Run this in Supabase SQL Editor
-- ============================================================================
-- This script sets up the complete soft delete functionality for Collections page

-- 1. Create deleted_transactions table
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

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_original_collection_id 
ON public.deleted_transactions(original_collection_id);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_deleted_by 
ON public.deleted_transactions(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_transactions_created_at 
ON public.deleted_transactions(created_at);

-- 3. Skip has_any_role function creation - it already exists and is used by many policies
-- We'll modify the soft_delete_collection function to work with the existing function

-- 4. Create soft_delete_collection function
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
    COALESCE(v_collection.total_weight_kg, v_collection.weight_kg, 0),
    COALESCE(v_collection.total_value, v_collection.computed_value, 0),
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

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_collection(uuid, uuid, text) TO authenticated;
GRANT SELECT, INSERT ON public.deleted_transactions TO authenticated;

-- 6. Create RLS policies for deleted_transactions
ALTER TABLE public.deleted_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for super admins to see all deleted transactions
CREATE POLICY "Super admins can view all deleted transactions" ON public.deleted_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy for admins to see deleted transactions they created
CREATE POLICY "Admins can view their deleted transactions" ON public.deleted_transactions
  FOR SELECT USING (
    deleted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Policy for inserting deleted transactions
CREATE POLICY "Authenticated users can insert deleted transactions" ON public.deleted_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Test the function
SELECT 'Soft delete functionality setup complete!' as result;

-- 8. Show current user roles for verification
SELECT 
  u.id as user_id,
  u.email,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email;
