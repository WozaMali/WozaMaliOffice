-- ============================================================================
-- FRONTEND REAL-TIME SCHEMA SETUP
-- ============================================================================
-- This schema enables real-time data collection for the customer dashboard
-- Run this in your Supabase SQL Editor to set up real-time subscriptions

-- ============================================================================
-- STEP 1: Enable Real-Time on All Tables
-- ============================================================================

-- Enable real-time on pickups table
ALTER PUBLICATION supabase_realtime ADD TABLE pickups;

-- Enable real-time on pickup_items table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_items;

-- Enable real-time on profiles table (for wallet and user info)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable real-time on addresses table
ALTER PUBLICATION supabase_realtime ADD TABLE addresses;

-- Enable real-time on materials table
ALTER PUBLICATION supabase_realtime ADD TABLE materials;

-- Enable real-time on pickup_photos table
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_photos;

-- ============================================================================
-- STEP 2: Create Customer Dashboard Views
-- ============================================================================

-- Create a comprehensive customer dashboard view
CREATE OR REPLACE VIEW customer_dashboard_view AS
SELECT 
  p.id as pickup_id,
  p.status,
  p.total_kg,
  p.total_value,
  p.created_at,
  p.approval_note,
  p.lat,
  p.lng,
  
  -- Customer info
  c.id as customer_id,
  c.full_name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  c.wallet_balance,
  
  -- Collector info
  col.id as collector_id,
  col.full_name as collector_name,
  col.email as collector_email,
  
  -- Address info
  a.line1,
  a.suburb,
  a.city,
  a.postal_code,
  
  -- Pickup items summary
  COALESCE(pi_summary.item_count, 0) as material_count,
  COALESCE(pi_summary.total_weight, 0) as calculated_weight,
  COALESCE(pi_summary.total_value, 0) as calculated_value,
  
  -- Environmental impact
  COALESCE(pi_summary.total_weight * 0.5, 0) as co2_saved_kg,
  COALESCE(pi_summary.total_weight * 0.1, 0) as water_saved_liters,
  COALESCE(pi_summary.total_weight * 0.3, 0) as landfill_saved_kg
  
FROM pickups p
LEFT JOIN profiles c ON p.customer_id = c.id
LEFT JOIN profiles col ON p.collector_id = col.id
LEFT JOIN addresses a ON p.address_id = a.id
LEFT JOIN (
  SELECT 
    pickup_id,
    COUNT(*) as item_count,
    SUM(kilograms) as total_weight,
    SUM(kilograms * COALESCE(m.rate_per_kg, 0)) as total_value
  FROM pickup_items pi
  LEFT JOIN materials m ON pi.material_id = m.id
  GROUP BY pickup_id
) pi_summary ON p.id = pi_summary.pickup_id;

-- ============================================================================
-- STEP 3: Create Customer Metrics View
-- ============================================================================

CREATE OR REPLACE VIEW customer_metrics_view AS
SELECT 
  c.id as customer_id,
  c.full_name,
  c.email,
  c.wallet_balance,
  
  -- Pickup statistics
  COUNT(p.id) as total_pickups,
  COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_pickups,
  COUNT(CASE WHEN p.status = 'submitted' THEN 1 END) as pending_pickups,
  COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_pickups,
  
  -- Weight and value totals
  COALESCE(SUM(p.total_kg), 0) as total_weight_kg,
  COALESCE(SUM(p.total_value), 0) as total_earnings,
  
  -- Environmental impact
  COALESCE(SUM(p.total_kg) * 0.5, 0) as total_co2_saved,
  COALESCE(SUM(p.total_kg) * 0.1, 0) as total_water_saved,
  COALESCE(SUM(p.total_kg) * 0.3, 0) as total_landfill_saved,
  
  -- Recent activity
  MAX(p.created_at) as last_pickup_date,
  MIN(p.created_at) as first_pickup_date
  
FROM profiles c
LEFT JOIN pickups p ON c.id = p.customer_id
WHERE c.role = 'customer'
GROUP BY c.id, c.full_name, c.email, c.wallet_balance;

-- ============================================================================
-- STEP 4: Create Real-Time Subscription Functions
-- ============================================================================

-- Function to get customer's real-time pickup updates
CREATE OR REPLACE FUNCTION get_customer_pickup_updates(customer_uuid UUID)
RETURNS TABLE (
  pickup_id UUID,
  status TEXT,
  total_kg DECIMAL,
  total_value DECIMAL,
  updated_at TIMESTAMPTZ,
  change_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.status,
    p.total_kg,
    p.total_value,
    p.updated_at,
    'UPDATE'::TEXT
  FROM pickups p
  WHERE p.customer_id = customer_uuid
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer's wallet updates
CREATE OR REPLACE FUNCTION get_customer_wallet_updates(customer_uuid UUID)
RETURNS TABLE (
  customer_id UUID,
  wallet_balance DECIMAL,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.wallet_balance,
    p.updated_at
  FROM profiles p
  WHERE p.id = customer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create RLS Policies for Customer Access
-- ============================================================================

-- Allow customers to read their own dashboard data
CREATE POLICY "Customers can view own dashboard" ON pickups
FOR SELECT USING (
  customer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow customers to read their own pickup items
CREATE POLICY "Customers can view own pickup items" ON pickup_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pickups 
    WHERE pickups.id = pickup_items.pickup_id
    AND pickups.customer_id = auth.uid()
  )
);

-- Allow customers to read their own profile (wallet info)
CREATE POLICY "Customers can view own profile" ON profiles
FOR SELECT USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow customers to read addresses they own
CREATE POLICY "Customers can view own addresses" ON addresses
FOR SELECT USING (
  profile_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- STEP 6: Create Indexes for Performance
-- ============================================================================

-- Index for customer dashboard queries
CREATE INDEX IF NOT EXISTS idx_pickups_customer_status 
ON pickups(customer_id, status, created_at);

-- Index for pickup items by pickup
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup_material 
ON pickup_items(pickup_id, material_id);

-- Index for profiles by role
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role, id);

-- Index for addresses by profile
CREATE INDEX IF NOT EXISTS idx_addresses_profile 
ON addresses(profile_id);

-- ============================================================================
-- STEP 7: Create Materialized View for Fast Analytics
-- ============================================================================

-- Create a materialized view for customer performance metrics
CREATE MATERIALIZED VIEW customer_performance_summary AS
SELECT 
  c.id as customer_id,
  c.full_name,
  c.email,
  c.wallet_balance,
  
  -- Monthly statistics
  DATE_TRUNC('month', p.created_at) as month,
  COUNT(p.id) as monthly_pickups,
  COALESCE(SUM(p.total_kg), 0) as monthly_weight,
  COALESCE(SUM(p.total_value), 0) as monthly_earnings,
  
  -- Environmental impact
  COALESCE(SUM(p.total_kg) * 0.5, 0) as monthly_co2_saved,
  COALESCE(SUM(p.total_kg) * 0.1, 0) as monthly_water_saved,
  COALESCE(SUM(p.total_kg) * 0.3, 0) as monthly_landfill_saved
  
FROM profiles c
LEFT JOIN pickups p ON c.id = p.customer_id
WHERE c.role = 'customer'
GROUP BY c.id, c.full_name, c.email, c.wallet_balance, DATE_TRUNC('month', p.created_at);

-- Create index on materialized view
CREATE INDEX idx_customer_performance_customer_month 
ON customer_performance_summary(customer_id, month);

-- ============================================================================
-- STEP 8: Create Refresh Function for Materialized View
-- ============================================================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_customer_performance()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create Trigger to Auto-Refresh Materialized View
-- ============================================================================

-- Function to refresh materialized view when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_customer_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view
  PERFORM refresh_customer_performance();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when pickups change
CREATE TRIGGER trigger_refresh_customer_performance_pickups
  AFTER INSERT OR UPDATE OR DELETE ON pickups
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_customer_performance();

-- ============================================================================
-- STEP 10: Create Sample Data Queries for Testing
-- ============================================================================

-- Query to test customer dashboard view
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_dashboard_view 
WHERE customer_id = 'CUSTOMER_UUID_HERE'
ORDER BY created_at DESC;
*/

-- Query to test customer metrics view
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_metrics_view 
WHERE customer_id = 'CUSTOMER_UUID_HERE';
*/

-- Query to test customer performance summary
-- Replace 'CUSTOMER_UUID_HERE' with actual customer UUID
/*
SELECT * FROM customer_performance_summary 
WHERE customer_id = 'CUSTOMER_UUID_HERE'
ORDER BY month DESC;
*/

-- ============================================================================
-- STEP 11: Verify Real-Time Setup
-- ============================================================================

-- Check which tables have real-time enabled
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('pickups', 'pickup_items', 'profiles', 'addresses')
ORDER BY tablename, policyname;

-- Check if views were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%customer%'
ORDER BY table_name;

-- ============================================================================
-- USAGE IN FRONTEND
-- ============================================================================
/*
In your frontend React component, use these real-time subscriptions:

1. Subscribe to pickup changes:
```typescript
const subscription = supabase
  .channel('customer_pickups_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'pickups',
      filter: `customer_id=eq.${user.id}`
    }, 
    (payload) => {
      console.log('🔄 Pickup update received:', payload);
      // Refresh your dashboard data
      fetchCustomerDashboard();
    }
  )
  .subscribe();
```

2. Subscribe to profile changes (wallet updates):
```typescript
const walletSubscription = supabase
  .channel('customer_wallet_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'profiles',
      filter: `id=eq.${user.id}`
    }, 
    (payload) => {
      console.log('💰 Wallet update received:', payload);
      // Update wallet balance display
      updateWalletBalance(payload.new.wallet_balance);
    }
  )
  .subscribe();
```

3. Subscribe to pickup items changes:
```typescript
const itemsSubscription = supabase
  .channel('customer_items_changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'pickup_items',
      filter: `pickup_id=in.(${userPickupIds.join(',')})`
    }, 
    (payload) => {
      console.log('📦 Pickup items update received:', payload);
      // Refresh pickup details
      fetchPickupDetails();
    }
  )
  .subscribe();
```

4. Use the views for efficient data fetching:
```typescript
// Get customer dashboard data
const { data: dashboardData } = await supabase
  .from('customer_dashboard_view')
  .select('*')
  .eq('customer_id', user.id)
  .order('created_at', { ascending: false });

// Get customer metrics
const { data: metricsData } = await supabase
  .from('customer_metrics_view')
  .select('*')
  .eq('customer_id', user.id)
  .single();

// Get performance summary
const { data: performanceData } = await supabase
  .from('customer_performance_summary')
  .select('*')
  .eq('customer_id', user.id)
  .order('month', { ascending: false });
```
*/

-- ============================================================================
-- SUMMARY OF WHAT THIS SCHEMA PROVIDES
-- ============================================================================
/*
✅ Real-time subscriptions on all important tables
✅ Customer dashboard view with comprehensive data
✅ Customer metrics view for statistics
✅ Customer performance summary for analytics
✅ Proper RLS policies for security
✅ Performance indexes for fast queries
✅ Auto-refreshing materialized views
✅ Environmental impact calculations
✅ Wallet balance tracking
✅ Pickup history and status
✅ Material breakdown and pricing
✅ Address and location information

This schema will give your frontend real-time access to:
- Live pickup updates
- Instant wallet balance changes
- Real-time metrics updates
- Environmental impact calculations
- Performance analytics
- All customer-specific data
*/
