# Frontend Database Unification Guide

## 🎯 **Objective**
Unify all frontend applications (Customer Dashboard, Office Dashboard, Collector App) to pull data from the same database source, ensuring data consistency across all interfaces.

## 🗄️ **Current Database Schema**

### **Core Tables**
- `profiles` - User accounts and roles
- `pickups` - Pickup requests and status
- `pickup_items` - Individual items within pickups (with kilograms and materials)
- `materials` - Material types and rates per kg
- `wallets` - Customer wallet balances
- `addresses` - Customer addresses
- `user_activity_log` - System activity tracking

### **Key Relationships**
- `pickups.user_id` → `profiles.id` (customer)
- `pickups.collector_id` → `profiles.id` (collector)
- `pickup_items.pickup_id` → `pickups.id`
- `pickup_items.material_id` → `materials.id`
- `wallets.user_id` → `profiles.id`

## 🔧 **Frontend Integration Requirements**

### **1. Supabase Client Setup**

```typescript
// src/lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### **2. Environment Variables**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 **Data Fetching Patterns**

### **Customer Dashboard Data**

```typescript
// src/lib/customer-services.ts
export class CustomerServices {
  // Get customer's pickup history with calculated totals
  async getCustomerPickups(customerId: string) {
    const { data: pickups, error } = await supabase
      .from('pickups')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        pickup_items (
          id,
          kilograms,
          contamination_pct,
          material: materials (
            id,
            name,
            rate_per_kg
          )
        )
      `)
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate totals from pickup_items
    return pickups.map(pickup => ({
      ...pickup,
      total_kg: pickup.pickup_items.reduce((sum, item) => sum + (item.kilograms || 0), 0),
      total_value: pickup.pickup_items.reduce((sum, item) => 
        sum + ((item.kilograms || 0) * (item.material?.rate_per_kg || 0)), 0
      )
    }))
  }

  // Get customer's wallet balance
  async getCustomerWallet(customerId: string) {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance, total_points, tier')
      .eq('user_id', customerId)
      .single()

    if (error) throw error
    return wallet
  }

  // Get customer's calculated wallet amount (30% of approved pickups)
  async getCustomerCalculatedWallet(customerId: string) {
    const { data: approvedPickups, error } = await supabase
      .from('pickups')
      .select(`
        pickup_items (
          kilograms,
          material: materials (rate_per_kg)
        )
      `)
      .eq('user_id', customerId)
      .eq('status', 'approved')

    if (error) throw error

    const totalValue = approvedPickups.reduce((sum, pickup) => 
      sum + pickup.pickup_items.reduce((itemSum, item) => 
        itemSum + ((item.kilograms || 0) * (item.material?.rate_per_kg || 0)), 0
      ), 0
    )

    return totalValue * 0.3 // 30% of total value
  }
}
```

### **Office Dashboard Data**

```typescript
// src/lib/admin-services.ts
export class AdminServices {
  // Get all pickups with calculated totals
  async getPickups() {
    // Step 1: Get basic pickup data
    const { data: pickups, error: pickupsError } = await supabase
      .from('pickups')
      .select('*')
      .order('created_at', { ascending: false })

    if (pickupsError) throw pickupsError

    // Step 2: Get customer profiles
    const customerIds = [...new Set(pickups.map(p => p.user_id).filter(Boolean))]
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', customerIds)

    if (customersError) throw customersError

    // Step 3: Get collector profiles
    const collectorIds = [...new Set(pickups.map(p => p.collector_id).filter(Boolean))]
    const { data: collectors, error: collectorsError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', collectorIds)

    if (collectorsError) throw collectorsError

    // Step 4: Get pickup items and materials
    const pickupIds = pickups.map(p => p.id)
    const { data: pickupItems, error: itemsError } = await supabase
      .from('pickup_items')
      .select(`
        pickup_id,
        kilograms,
        contamination_pct,
        material: materials (id, name, rate_per_kg)
      `)
      .in('pickup_id', pickupIds)

    if (itemsError) throw itemsError

    // Step 5: Combine all data
    return pickups.map(pickup => {
      const customer = customers.find(c => c.id === pickup.user_id)
      const collector = collectors.find(c => c.id === pickup.collector_id)
      const items = pickupItems.filter(pi => pi.pickup_id === pickup.id)
      
      const totalKg = items.reduce((sum, item) => sum + (item.kilograms || 0), 0)
      const totalValue = items.reduce((sum, item) => 
        sum + ((item.kilograms || 0) * (item.material?.rate_per_kg || 0)), 0
      )

      return {
        ...pickup,
        customer,
        collector,
        pickup_items: items,
        total_kg: totalKg,
        total_value: totalValue
      }
    })
  }

  // Get customer overview with wallet balances
  async getCustomerOverview() {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        wallets (balance, total_points, tier)
      `)
      .eq('role', 'CUSTOMER')
      .order('full_name')

    if (error) throw error
    return customers
  }

  // Get wallet balances
  async getWalletBalances() {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select(`
        balance,
        total_points,
        tier,
        profiles!wallets_user_id_fkey (full_name, email)
      `)
      .order('balance', { ascending: false })

    if (error) throw error
    return wallets
  }
}
```

### **Collector App Data**

```typescript
// src/lib/collector-services.ts
export class CollectorServices {
  // Get collector's assigned pickups
  async getCollectorPickups(collectorId: string) {
    const { data: pickups, error } = await supabase
      .from('pickups')
      .select(`
        id,
        status,
        created_at,
        scheduled_date,
        customer: profiles!pickups_user_id_fkey (
          full_name,
          phone,
          addresses (street, city, postal_code)
        ),
        pickup_items (
          id,
          kilograms,
          contamination_pct,
          material: materials (name, rate_per_kg)
        )
      `)
      .eq('collector_id', collectorId)
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    // Calculate totals
    return pickups.map(pickup => ({
      ...pickup,
      total_kg: pickup.pickup_items.reduce((sum, item) => sum + (item.kilograms || 0), 0),
      total_value: pickup.pickup_items.reduce((sum, item) => 
        sum + ((item.kilograms || 0) * (item.material?.rate_per_kg || 0)), 0
      )
    }))
  }

  // Update pickup status
  async updatePickupStatus(pickupId: string, status: string) {
    const { data, error } = await supabase
      .from('pickups')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', pickupId)
      .select()

    if (error) throw error
    return data[0]
  }
}
```

## 🔐 **Row Level Security (RLS) Policies**

### **Profiles Table**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'admin')
    )
  );
```

### **Pickups Table**
```sql
-- Customers can see their own pickups
CREATE POLICY "Customers can view own pickups" ON pickups
  FOR SELECT USING (auth.uid() = user_id);

-- Collectors can see assigned pickups
CREATE POLICY "Collectors can view assigned pickups" ON pickups
  FOR SELECT USING (auth.uid() = collector_id);

-- Admins can see all pickups
CREATE POLICY "Admins can view all pickups" ON pickups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'admin')
    )
  );
```

### **Wallets Table**
```sql
-- Users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all wallets
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'admin')
    )
  );
```

## 📱 **Frontend Component Examples**

### **Customer Dashboard Component**
```tsx
// src/components/customer/WalletBalance.tsx
'use client'

import { useEffect, useState } from 'react'
import { CustomerServices } from '@/lib/customer-services'

export default function WalletBalance({ customerId }: { customerId: string }) {
  const [walletBalance, setWalletBalance] = useState(0)
  const [calculatedBalance, setCalculatedBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const customerServices = new CustomerServices()
        
        // Get stored wallet balance
        const wallet = await customerServices.getCustomerWallet(customerId)
        setWalletBalance(wallet.balance)
        
        // Get calculated balance (30% of approved pickups)
        const calculated = await customerServices.getCustomerCalculatedWallet(customerId)
        setCalculatedBalance(calculated)
      } catch (error) {
        console.error('Error loading wallet data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWalletData()
  }, [customerId])

  if (loading) return <div>Loading wallet...</div>

  return (
    <div className="wallet-balance">
      <h3>Wallet Balance</h3>
      <div className="balance-display">
        <div className="stored-balance">
          <span>Available Balance:</span>
          <strong>R{walletBalance.toFixed(2)}</strong>
        </div>
        <div className="calculated-balance">
          <span>Pending from Pickups:</span>
          <strong>R{calculatedBalance.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  )
}
```

### **Office Dashboard Component**
```tsx
// src/components/admin/CustomerOverview.tsx
'use client'

import { useEffect, useState } from 'react'
import { AdminServices } from '@/lib/admin-services'

export default function CustomerOverview() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const adminServices = new AdminServices()
        const data = await adminServices.getCustomerOverview()
        setCustomers(data)
      } catch (error) {
        console.error('Error loading customers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  if (loading) return <div>Loading customers...</div>

  return (
    <div className="customer-overview">
      <h3>Customer Overview</h3>
      <div className="customers-grid">
        {customers.map((customer: any) => (
          <div key={customer.id} className="customer-card">
            <h4>{customer.full_name}</h4>
            <p>Email: {customer.email}</p>
            <p>Wallet: R{customer.wallets?.balance || 0}</p>
            <p>Points: {customer.wallets?.total_points || 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Setup**
1. **Install Supabase client** in all frontend projects
2. **Configure environment variables** with your Supabase credentials
3. **Update authentication** to use Supabase Auth

### **Phase 2: Data Layer**
1. **Replace existing API calls** with Supabase queries
2. **Implement the service classes** shown above
3. **Update components** to use new data sources

### **Phase 3: Testing**
1. **Test data consistency** between dashboards
2. **Verify RLS policies** are working correctly
3. **Check performance** of new queries

### **Phase 4: Deployment**
1. **Deploy updated frontends**
2. **Monitor for any data inconsistencies**
3. **Update documentation** for future developers

## 🔍 **Troubleshooting**

### **Common Issues**
- **RLS Policy Violations**: Check user roles and policy definitions
- **Data Type Mismatches**: Ensure frontend types match database schema
- **Performance Issues**: Use appropriate indexes and query optimization

### **Debug Queries**
```sql
-- Check user roles
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename = 'pickups';

-- Test data access
SELECT * FROM pickups LIMIT 5;
```

## 📋 **Next Steps**

1. **Review the service classes** and adapt them to your existing codebase
2. **Update your environment variables** with Supabase credentials
3. **Test the integration** with a small component first
4. **Gradually migrate** other components to use the unified data source

This approach ensures that all frontends pull data from the same database, eliminating discrepancies between customer and office dashboards.
