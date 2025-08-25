# 🚀 Apply Rewards and Metrics System Schema to Supabase

## 📋 **What This Guide Covers**

This guide will help you apply the new **Rewards and Metrics System Schema** to your Supabase database. This schema adds comprehensive functionality for:

- **Cross-repository communication** with external services
- **Enhanced wallet system** with points and tiers
- **Rewards and badges** system
- **Donations and campaigns** management
- **Withdrawal requests** processing
- **User and system metrics** tracking
- **Webhook endpoints** for external integrations

## 🔧 **Prerequisites**

✅ **Supabase Project** - You already have this configured  
✅ **Admin Access** - You need admin privileges to your Supabase project  
✅ **Environment Variables** - Your `.env` file is already configured  

## 📊 **Step-by-Step Application**

### **Step 1: Access Supabase SQL Editor**

1. **Go to your Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `mljtjntkddwkcjixkyuy`

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New Query"** to create a new SQL script

### **Step 2: Copy and Paste the Schema**

1. **Copy the Complete Schema**
   - Open the file `rewards-metrics-system-schema.sql` in your project
   - Select all content (Ctrl+A) and copy it (Ctrl+C)

2. **Paste into SQL Editor**
   - In the Supabase SQL Editor, paste the entire schema
   - The schema is quite large (~15KB) so it may take a moment to load

### **Step 3: Execute the Schema**

1. **Review the Schema**
   - The schema creates 15 new tables
   - Includes 3 PL/pgSQL functions
   - Sets up Row Level Security (RLS) policies
   - Creates performance indexes
   - Inserts initial seed data

2. **Run the Schema**
   - Click the **"Run"** button (▶️) in the SQL Editor
   - Wait for execution to complete (should take 10-30 seconds)

3. **Verify Success**
   - You should see a success message
   - No error messages should appear

## 🔍 **Verification Steps**

### **Check New Tables Created**

After running the schema, verify these tables exist:

```sql
-- Check if new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'external_services',
  'service_api_keys', 
  'sync_queue',
  'enhanced_wallets',
  'wallet_sync_history',
  'reward_definitions',
  'user_rewards',
  'donation_campaigns',
  'user_donations',
  'withdrawal_requests',
  'user_metrics',
  'system_metrics',
  'webhook_endpoints',
  'webhook_deliveries'
);
```

### **Check Initial Data**

```sql
-- Verify default external services were created
SELECT service_name, service_type, is_active 
FROM external_services;

-- Verify default reward definitions were created
SELECT reward_code, name, reward_type 
FROM reward_definitions;
```

### **Check Functions**

```sql
-- Verify PL/pgSQL functions were created
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_to_sync_queue',
  'update_wallet_with_sync',
  'process_sync_queue'
);
```

## 🚨 **Troubleshooting**

### **Common Issues and Solutions**

#### **Issue 1: "Table already exists"**
- **Solution**: This is normal! The schema uses `CREATE TABLE IF NOT EXISTS`
- **Action**: Continue execution - existing tables won't be affected

#### **Issue 2: "Permission denied"**
- **Solution**: Ensure you're using the SQL Editor (not the JavaScript client)
- **Action**: The SQL Editor has full admin privileges

#### **Issue 3: "Function already exists"**
- **Solution**: This is normal! The schema uses `CREATE OR REPLACE FUNCTION`
- **Action**: Continue execution - functions will be updated

#### **Issue 4: "Policy already exists"**
- **Solution**: This is normal! Policies may already exist
- **Action**: Continue execution - duplicate policies will be ignored

### **If Something Goes Wrong**

1. **Check the Error Message**
   - Copy the exact error text
   - Note which line/statement failed

2. **Partial Rollback (if needed)**
   ```sql
   -- Drop specific tables if needed
   DROP TABLE IF EXISTS webhook_deliveries CASCADE;
   DROP TABLE IF EXISTS webhook_endpoints CASCADE;
   -- ... continue for other tables
   ```

3. **Re-run the Schema**
   - Fix any issues identified
   - Re-run the entire schema

## 🎯 **What Happens After Application**

### **New Database Capabilities**

✅ **External Service Integration**
- Connect to external wallet, rewards, and analytics services
- Queue-based synchronization system
- Webhook endpoints for real-time updates

✅ **Enhanced User Experience**
- Points-based rewards system
- Tier-based progression (Bronze → Silver → Gold → Platinum)
- Donation campaigns and tracking
- Withdrawal request processing

✅ **Advanced Analytics**
- Daily user metrics tracking
- System-wide performance metrics
- Cross-repository data synchronization

### **Integration Points**

The new schema integrates with your existing system:

- **Profiles table** - Links to enhanced wallets
- **Pickups table** - Can trigger reward point calculations
- **Materials table** - Can influence point calculations
- **Payments table** - Can integrate with withdrawal system

## 🔄 **Next Steps After Schema Application**

### **Immediate Actions**

1. **Test Basic Functionality**
   - Create a test user wallet
   - Issue some test points
   - Test the sync queue functions

2. **Configure External Services**
   - Update the default service URLs
   - Configure your actual external service endpoints
   - Test webhook connectivity

3. **Update Your Applications**
   - Modify the Collector UI to show rewards/points
   - Update the Admin UI to manage rewards
   - Integrate wallet functionality

### **Application Updates Needed**

- **Collector App**: Add rewards display, points tracking
- **Admin App**: Add rewards management, metrics dashboard
- **API Services**: Add new endpoints for rewards/wallets
- **UI Components**: Create rewards, donations, and wallet components

## 📚 **Additional Resources**

### **Schema Documentation**

- **File**: `rewards-metrics-system-schema.sql`
- **Size**: ~15KB
- **Tables**: 15 new tables
- **Functions**: 3 PL/pgSQL functions
- **Policies**: Comprehensive RLS setup

### **Related Files**

- **Main Schema**: `schemas/00-install-all.sql` (existing system)
- **New Schema**: `rewards-metrics-system-schema.sql` (this addition)
- **Test Script**: `apply-rewards-schema.js` (automated application)

### **Support**

If you encounter issues:

1. **Check the error messages** in the SQL Editor
2. **Verify table creation** using the verification queries above
3. **Review the schema file** for syntax issues
4. **Contact support** with specific error details

---

## 🎉 **Ready to Apply!**

You now have everything you need to apply the Rewards and Metrics System Schema to your Supabase database. The schema will transform your recycling management system into a comprehensive platform with rewards, analytics, and external service integration.

**Next**: Follow the steps above to apply the schema, then we can begin integrating the new functionality into your Collector and Admin/Office UIs!
