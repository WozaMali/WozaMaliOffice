# Admin Customer Reset Guide

This guide explains how to set up and use the admin functions to reset customer kgs and amounts back to zero in the Woza Mali Office system.

## 🚀 Quick Setup

### Step 1: Run the Database Schema
Execute the SQL script in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
\i admin-customer-reset-functions.sql
```

### Step 2: Verify Installation
Check that the functions were created successfully:

```sql
-- Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE 'admin_reset%';

-- Check if views exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE 'admin_customer%';
```

## 🔧 Available Functions

### 1. Reset Customer Pickup Data Only
```sql
SELECT admin_reset_customer_pickup_data(
  'customer-uuid-here',
  'Customer requested reset due to data error',
  auth.uid()
);
```

**What it does:**
- Sets all `pickup_items.kilograms` to 0 for the customer
- Since `total_kg` and `total_value` are calculated from pickup_items, they automatically become 0
- Logs the action in `user_activity_log`

### 2. Reset Customer Wallet Only
```sql
SELECT admin_reset_customer_wallet(
  'customer-uuid-here',
  'Wallet balance correction',
  auth.uid()
);
```

**What it does:**
- Sets `wallets.balance` to 0 for the customer
- Creates a wallet record if one doesn't exist
- Logs the action in `user_activity_log`

### 3. Reset Customer Complete Data
```sql
SELECT admin_reset_customer_complete(
  'customer-uuid-here',
  'Full customer data reset',
  auth.uid()
);
```

**What it does:**
- Combines both pickup data and wallet resets
- Most comprehensive reset option

## 📊 Admin Dashboard Views

### Customer Overview
```sql
SELECT * FROM admin_customer_overview;
```
Shows all customers with their current totals and reset eligibility.

### Customers for Reset
```sql
SELECT * FROM admin_customers_for_reset;
```
Shows only customers who have data that can be reset.

### Reset Statistics
```sql
SELECT get_admin_reset_statistics();
```
Returns comprehensive statistics about resets and customer data.

## 🎯 Frontend Integration

### 1. Import the Component
```tsx
import CustomerResetPanel from '../components/admin/CustomerResetPanel';

// Use in your admin page
<CustomerResetPanel />
```

### 2. Use the Services
```tsx
import { adminResetServices } from '../lib/admin-reset-services';

// Reset a single customer
const result = await adminResetServices.resetCustomerComplete({
  customerUuid: 'customer-id',
  resetReason: 'Data correction'
});

// Get customer overview
const customers = await adminResetServices.getCustomerOverview();

// Batch reset multiple customers
const results = await adminResetServices.batchResetCustomers([
  'customer-1-id',
  'customer-2-id'
], 'Batch correction');
```

## 🔒 Security Features

### Admin-Only Access
- All functions verify the calling user has `ADMIN` role
- RLS policies ensure only admins can execute reset functions
- Audit logging tracks all reset actions

### Audit Trail
Every reset action is logged with:
- Customer information before reset
- Reset reason
- Admin user who performed the action
- Timestamp
- Metadata about what was reset

### Confirmation Dialogs
- Frontend requires confirmation before any reset
- Batch operations show count of affected customers
- Clear success/failure feedback

## 📋 Usage Examples

### Example 1: Customer Requests Data Reset
```sql
-- Customer John Doe wants his pickup data reset
SELECT admin_reset_customer_pickup_data(
  'john-doe-uuid',
  'Customer requested reset - data entry error',
  auth.uid()
);
```

### Example 2: Correct Wallet Balance
```sql
-- Fix incorrect wallet balance for Jane Smith
SELECT admin_reset_customer_wallet(
  'jane-smith-uuid',
  'Correcting incorrect wallet balance',
  auth.uid()
);
```

### Example 3: Full Customer Reset
```sql
-- Complete reset for customer with multiple issues
SELECT admin_reset_customer_complete(
  'problem-customer-uuid',
  'Full reset due to system migration issues',
  auth.uid()
);
```

## 🚨 Important Notes

### Data Loss Warning
- **Resets are irreversible** - data cannot be recovered
- Always verify customer identity before resetting
- Use appropriate reset reasons for audit purposes

### Performance Considerations
- Batch operations process customers sequentially
- Large customer bases may take time to process
- Consider running during off-peak hours

### Backup Recommendations
- Consider backing up customer data before major reset operations
- Test reset functions in development environment first
- Monitor system performance during batch operations

## 🔍 Troubleshooting

### Common Issues

#### 1. Function Not Found
```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'admin_reset_customer_pickup_data';
```

#### 2. Permission Denied
```sql
-- Verify user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_activity_log';
```

#### 3. Customer Not Found
```sql
-- Verify customer exists and is a customer
SELECT id, full_name, role FROM profiles 
WHERE id = 'customer-uuid' AND role = 'CUSTOMER';
```

### Debug Queries

#### Check Reset History
```sql
SELECT * FROM get_customer_reset_history('customer-uuid', 30);
```

#### View Recent Activity
```sql
SELECT * FROM user_activity_log 
WHERE activity_type LIKE 'ADMIN_RESET%' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Verify Customer Data
```sql
SELECT 
  c.full_name,
  c.wallet_balance,
  COUNT(p.id) as pickup_count,
  COALESCE(SUM(p.total_kg), 0) as total_kg,
  COALESCE(SUM(p.total_value), 0) as total_value
FROM profiles c
LEFT JOIN pickups p ON c.id = p.customer_id
WHERE c.id = 'customer-uuid'
GROUP BY c.id, c.full_name, c.wallet_balance;
```

## 📱 Frontend Features

### Customer Reset Panel
- **Statistics Dashboard**: Shows total customers, reset counts, and trends
- **Batch Operations**: Select multiple customers for simultaneous reset
- **Search & Filter**: Find specific customers quickly
- **Individual Actions**: Reset specific data types per customer
- **Real-time Updates**: Data refreshes after operations
- **Progress Indicators**: Loading states and confirmation dialogs

### Responsive Design
- Works on desktop and mobile devices
- Optimized table layouts for different screen sizes
- Touch-friendly buttons and controls

## 🔄 Maintenance

### Regular Tasks
- Monitor reset activity logs
- Review reset reasons for patterns
- Clean up old audit logs if needed
- Update reset reasons for consistency

### Performance Optimization
- Consider indexing on frequently queried fields
- Monitor materialized view refresh performance
- Archive old activity logs if volume is high

## 📞 Support

If you encounter issues:
1. Check the audit logs for error details
2. Verify database permissions and RLS policies
3. Test functions with known good customer IDs
4. Check Supabase function logs for execution errors

## 🎉 Success Checklist

- [ ] Database functions created successfully
- [ ] RLS policies applied correctly
- [ ] Admin views accessible
- [ ] Frontend component integrated
- [ ] Test resets with sample data
- [ ] Team trained on proper usage
- [ ] Audit logging working
- [ ] Backup procedures in place

---

**Remember**: With great power comes great responsibility. Use these reset functions carefully and always maintain proper audit trails for compliance and troubleshooting purposes.
