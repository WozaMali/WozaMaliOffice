-- ============================================================================
-- ADMIN CUSTOMER RESET FUNCTIONS (SIMPLIFIED VERSION)
-- ============================================================================
-- This script provides admin functions to reset customer kgs and amounts back to zero
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create Admin Functions for Resetting Customer Data
-- ============================================================================

-- Function to reset a customer's pickup data (kgs and amounts) to zero
CREATE OR REPLACE FUNCTION admin_reset_customer_pickup_data(
  customer_uuid UUID,
  reset_reason TEXT DEFAULT 'Admin reset',
  admin_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  customer_profile RECORD;
  pickup_count INTEGER;
  total_kg_reset DECIMAL;
  total_value_reset DECIMAL;
  reset_log_id UUID;
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = admin_user_id AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset customer data';
  END IF;

  -- Get customer profile information
  SELECT * INTO customer_profile 
  FROM public.profiles 
  WHERE id = customer_uuid AND role = 'CUSTOMER';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or is not a customer user';
  END IF;

  -- Count affected pickups and calculate totals before reset
  SELECT 
    COUNT(*),
    COALESCE(SUM(pi.total_kg), 0),
    COALESCE(SUM(pi.total_value), 0)
  INTO pickup_count, total_kg_reset, total_value_reset
  FROM public.pickups p
  LEFT JOIN (
    SELECT 
      pickup_id,
      SUM(kilograms) as total_kg,
      SUM(kilograms * m.rate_per_kg) as total_value
    FROM public.pickup_items pi
    JOIN public.materials m ON pi.material_id = m.id
    GROUP BY pickup_id
  ) pi ON p.id = pi.pickup_id
  WHERE p.user_id = customer_uuid;

  -- Create audit log entry
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    admin_user_id,
    'ADMIN_RESET_CUSTOMER_DATA',
    format('Reset customer %s pickup data: %s kg, %s value', 
           customer_profile.full_name, 
           total_kg_reset, 
           total_value_reset),
    jsonb_build_object(
      'customer_id', customer_uuid,
      'customer_name', customer_profile.full_name,
      'pickups_affected', pickup_count,
      'total_kg_reset', total_kg_reset,
      'total_value_reset', total_value_reset,
      'reset_reason', reset_reason,
      'admin_user_id', admin_user_id
    )
  ) RETURNING id INTO reset_log_id;

  -- Reset pickup_items kilograms to zero
  UPDATE public.pickup_items 
  SET kilograms = 0
  WHERE pickup_id IN (
    SELECT id FROM public.pickups WHERE user_id = customer_uuid
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully reset customer %s data', customer_profile.full_name),
    'customer_id', customer_uuid,
    'customer_name', customer_profile.full_name,
    'pickups_affected', pickup_count,
    'total_kg_reset', total_kg_reset,
    'total_value_reset', total_value_reset,
    'reset_reason', reset_reason,
    'admin_user_id', admin_user_id,
    'reset_log_id', reset_log_id,
    'reset_timestamp', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.user_activity_log (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      COALESCE(admin_user_id, auth.uid()),
      'ADMIN_RESET_ERROR',
      format('Error resetting customer %s data: %s', customer_uuid, SQLERRM),
      jsonb_build_object(
        'customer_id', customer_uuid,
        'error_message', SQLERRM,
        'error_detail', SQLSTATE
      )
    );
    
    RAISE EXCEPTION 'Failed to reset customer data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset a customer's wallet balance to zero
CREATE OR REPLACE FUNCTION admin_reset_customer_wallet(
  customer_uuid UUID,
  reset_reason TEXT DEFAULT 'Admin reset',
  admin_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  customer_profile RECORD;
  old_balance DECIMAL;
  reset_log_id UUID;
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = admin_user_id AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset customer wallets';
  END IF;

  -- Get customer profile information
  SELECT * INTO customer_profile 
  FROM public.profiles 
  WHERE id = customer_uuid AND role = 'CUSTOMER';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or is not a customer user';
  END IF;

  -- Get current wallet balance from wallets table
  SELECT COALESCE(w.balance, 0) INTO old_balance
  FROM public.wallets w
  WHERE w.user_id = customer_uuid;
  
  -- If wallet doesn't exist, create one with zero balance
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (customer_uuid, 0);
    old_balance = 0;
  END IF;

  -- Create audit log entry
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    admin_user_id,
    'ADMIN_RESET_WALLET',
    format('Reset customer %s wallet balance from %s to 0', 
           customer_profile.full_name, 
           old_balance),
    jsonb_build_object(
      'customer_id', customer_uuid,
      'customer_name', customer_profile.full_name,
      'old_balance', old_balance,
      'new_balance', 0,
      'reset_reason', reset_reason,
      'admin_user_id', admin_user_id
    )
  ) RETURNING id INTO reset_log_id;

  -- Reset wallet balance to zero
  UPDATE public.wallets 
  SET 
    balance = 0
  WHERE user_id = customer_uuid;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully reset customer %s wallet balance', customer_profile.full_name),
    'customer_id', customer_uuid,
    'customer_name', customer_profile.full_name,
    'old_balance', old_balance,
    'new_balance', 0,
    'reset_reason', reset_reason,
    'admin_user_id', admin_user_id,
    'reset_log_id', reset_log_id,
    'reset_timestamp', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.user_activity_log (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      COALESCE(admin_user_id, auth.uid()),
      'ADMIN_RESET_WALLET_ERROR',
      format('Error resetting customer %s wallet: %s', customer_uuid, SQLERRM),
      jsonb_build_object(
        'customer_id', customer_uuid,
        'error_message', SQLERRM,
        'error_detail', SQLSTATE
      )
    );
    
    RAISE EXCEPTION 'Failed to reset customer wallet: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset a customer's complete data (pickups + wallet)
CREATE OR REPLACE FUNCTION admin_reset_customer_complete(
  customer_uuid UUID,
  reset_reason TEXT DEFAULT 'Admin reset',
  admin_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  pickup_result JSONB;
  wallet_result JSONB;
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = admin_user_id AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only administrators can reset customer data';
  END IF;

  -- Reset pickup data
  SELECT admin_reset_customer_pickup_data(customer_uuid, reset_reason, admin_user_id) INTO pickup_result;
  
  -- Reset wallet
  SELECT admin_reset_customer_wallet(customer_uuid, reset_reason, admin_user_id) INTO wallet_result;

  -- Return combined result
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully reset all customer data',
    'customer_id', customer_uuid,
    'pickup_reset', pickup_result,
    'wallet_reset', wallet_result,
    'reset_reason', reset_reason,
    'admin_user_id', admin_user_id,
    'reset_timestamp', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reset customer data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Create Simple Helper Functions
-- ============================================================================

-- Function to get customer reset history
CREATE OR REPLACE FUNCTION get_customer_reset_history(
  customer_uuid UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  log_id UUID,
  customer_id UUID,
  customer_name TEXT,
  activity_type TEXT,
  description TEXT,
  reset_reason TEXT,
  admin_user_id UUID,
  admin_name TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only administrators can view reset history';
  END IF;

  RETURN QUERY
  SELECT 
    ual.id as log_id,
    ual.metadata->>'customer_id'::UUID as customer_id,
    ual.metadata->>'customer_name' as customer_name,
    ual.activity_type,
    ual.description,
    ual.metadata->>'reset_reason' as reset_reason,
    ual.user_id as admin_user_id,
    p.full_name as admin_name,
    ual.created_at,
    ual.metadata
  FROM public.user_activity_log ual
  LEFT JOIN public.profiles p ON ual.user_id = p.id
  WHERE ual.activity_type IN ('ADMIN_RESET_CUSTOMER_DATA', 'ADMIN_RESET_WALLET', 'ADMIN_RESET_CUSTOMER_COMPLETE')
    AND (customer_uuid IS NULL OR ual.metadata->>'customer_id' = customer_uuid::TEXT)
    AND ual.created_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY ual.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_reset_statistics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verify the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Only administrators can view reset statistics';
  END IF;

  SELECT jsonb_build_object(
    'total_customers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'CUSTOMER'),
    'customers_with_data', (
      SELECT COUNT(*) FROM public.profiles c
      WHERE c.role = 'CUSTOMER' AND (
        EXISTS (
          SELECT 1 FROM public.pickup_items pi
          JOIN public.pickups p ON pi.pickup_id = p.id
          WHERE p.user_id = c.id AND pi.kilograms > 0
        ) OR EXISTS (
          SELECT 1 FROM public.wallets w
          WHERE w.user_id = c.id AND w.balance > 0
        )
      )
    ),
    'total_resets_today', (
      SELECT COUNT(*) FROM public.user_activity_log 
      WHERE activity_type LIKE 'ADMIN_RESET%' 
      AND created_at >= CURRENT_DATE
    ),
    'total_resets_week', (
      SELECT COUNT(*) FROM public.user_activity_log 
      WHERE activity_type LIKE 'ADMIN_RESET%' 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'total_resets_month', (
      SELECT COUNT(*) FROM public.user_activity_log 
      WHERE activity_type LIKE 'ADMIN_RESET%' 
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'recent_resets', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'customer_name', ual.metadata->>'customer_name',
          'reset_type', ual.activity_type,
          'reset_reason', ual.metadata->>'reset_reason',
          'admin_name', p.full_name,
          'timestamp', ual.created_at
        )
      )
      FROM public.user_activity_log ual
      LEFT JOIN public.profiles p ON ual.user_id = p.id
      WHERE ual.activity_type LIKE 'ADMIN_RESET%'
      ORDER BY ual.created_at DESC
      LIMIT 10
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Grant Permissions
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION admin_reset_customer_pickup_data(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_customer_wallet(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_customer_complete(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_reset_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_reset_statistics() TO authenticated;

-- ============================================================================
-- STEP 4: Usage Examples
-- ============================================================================

/*
-- Example 1: Reset a specific customer's pickup data only
SELECT admin_reset_customer_pickup_data(
  'customer-uuid-here',
  'Customer requested reset due to data error',
  auth.uid()
);

-- Example 2: Reset a specific customer's wallet only
SELECT admin_reset_customer_wallet(
  'customer-uuid-here',
  'Wallet balance correction',
  auth.uid()
);

-- Example 3: Reset a customer's complete data
SELECT admin_reset_customer_complete(
  'customer-uuid-here',
  'Full customer data reset',
  auth.uid()
);

-- Example 4: View reset history for a specific customer
SELECT * FROM get_customer_reset_history('customer-uuid-here', 90);

-- Example 5: Get admin dashboard statistics
SELECT get_admin_reset_statistics();
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Admin customer reset functions setup completed successfully!' as status;
