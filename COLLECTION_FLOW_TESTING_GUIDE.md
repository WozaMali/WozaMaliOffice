# Collection Flow Testing Guide

## Overview

This guide helps you test that collections created by collectors appear in the Admin/Office dashboard for approval.

## Prerequisites

1. **Unified Schema Applied**: Ensure the `UNIFIED_COLLECTION_SYSTEM.sql` has been applied to your Supabase database
2. **Admin User**: You have an admin user account in the `user_profiles` table with role `admin`
3. **Test Data**: Run the test script to create sample data if needed

## Testing Steps

### Step 1: Verify Database Setup

Run the test script in your Supabase SQL Editor:
```sql
-- File: WozaMaliOffice/test-collection-flow.sql
-- This will check tables, create test data, and verify the setup
```

### Step 2: Test Collection Creation (Collector Side)

1. **Login as Collector**: Use the collector app to login with a collector account
2. **Create Collection**: Submit a new collection with materials
3. **Verify Status**: The collection should be created with status `pending`

### Step 3: Test Admin Dashboard (Admin Side)

1. **Login as Admin**: Use the admin/office app to login with an admin account
2. **Check Collections Page**: Navigate to the Collections/Pickups page
3. **Verify Collection Appears**: The collection created by the collector should appear in the list
4. **Test Real-time Updates**: If you create a new collection in the collector app, it should appear immediately in the admin dashboard

### Step 4: Test Collection Approval

1. **Select Collection**: Click on a pending collection in the admin dashboard
2. **Approve/Reject**: Use the approve or reject buttons
3. **Add Notes**: Add admin notes explaining the decision
4. **Verify Update**: The collection status should update immediately

## Expected Behavior

### ✅ **Working Correctly**
- Collections created by collectors appear in admin dashboard
- Real-time updates work (new collections appear immediately)
- Admin can approve/reject collections
- Status updates are reflected in real-time
- Collection details show customer, collector, materials, and totals

### ❌ **Common Issues**

1. **Collections Not Appearing**
   - Check if unified schema is applied
   - Verify RLS policies allow admin access
   - Check browser console for errors

2. **Real-time Updates Not Working**
   - Verify Supabase real-time is enabled
   - Check network connection
   - Verify subscription is active

3. **Permission Errors**
   - Ensure admin user has correct role in `user_profiles`
   - Check RLS policies for `unified_collections` table

## Database Schema Verification

### Required Tables
- `unified_collections` - Main collection data
- `user_profiles` - User information (customers, collectors, admins)
- `collection_materials` - Materials in each collection
- `user_addresses` - User address information

### Required RLS Policies
- Admin users can view all collections
- Admin users can update collection status
- Collectors can create collections
- Customers can view their own collections

## Troubleshooting

### Check Collection Data
```sql
-- View all collections
SELECT * FROM unified_collections ORDER BY created_at DESC;

-- View collection materials
SELECT * FROM collection_materials ORDER BY created_at DESC;

-- View user profiles
SELECT * FROM user_profiles WHERE role IN ('customer', 'collector', 'admin');
```

### Check RLS Policies
```sql
-- View RLS policies on unified_collections
SELECT * FROM pg_policies WHERE tablename = 'unified_collections';
```

### Test Admin Access
```sql
-- Test if admin can access collections (run as admin user)
SELECT COUNT(*) FROM unified_collections;
```

## Files Modified for This Feature

- `WozaMaliOffice/src/lib/admin-services.ts` - Updated to use unified schema
- `WozaMaliOffice/src/components/admin/PickupsPage.tsx` - Fixed DollarSign import
- `WozaMaliOffice/test-collection-flow.sql` - Test script for verification

## Next Steps

1. **Test the flow** using the steps above
2. **Verify real-time updates** work properly
3. **Test with multiple collectors** creating collections
4. **Verify admin approval workflow** is complete
5. **Check error handling** for edge cases

The collection flow from collector to admin should now work seamlessly with the unified schema! 🎉
