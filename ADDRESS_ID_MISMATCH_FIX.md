# Address ID Mismatch Fix Guide

## Problem Identified
The popup save issue is caused by an **address ID mismatch** between the view and the actual `user_addresses` table:

- The `collection_member_user_addresses_view` is returning address IDs that don't exist in the `user_addresses` table
- When the collector app tries to create a pickup with `address_id = 'ada39fb9-b06f-4afd-af90-ec5fc0daa2c2'`, it fails because this ID doesn't exist in `user_addresses`
- The foreign key constraint is now correctly pointing to `user_addresses`, but the data is inconsistent

## Root Cause Analysis

1. **View Data Issue**: The `collection_member_user_addresses_view` might be:
   - Returning old address IDs from the previous `addresses` table
   - Not properly joined with the new `user_addresses` table
   - Missing data migration from old to new schema

2. **Data Migration Issue**: Addresses might not have been properly migrated from the old `addresses` table to the new `user_addresses` table

## Solution Steps

### Step 1: Debug the Data Issue
Run the debug script to understand the data mismatch:

```sql
-- Run this in Supabase SQL Editor
\i debug-address-id-issue.sql
```

### Step 2: Check the View Definition
The `collection_member_user_addresses_view` needs to be verified to ensure it's:
- Using the correct `user_addresses` table
- Not referencing old `addresses` table
- Properly joined with profiles

### Step 3: Fix Data Migration (if needed)
If addresses are missing from `user_addresses`, they need to be migrated:

```sql
-- Check if addresses need to be migrated
SELECT COUNT(*) as old_addresses FROM addresses;
SELECT COUNT(*) as new_addresses FROM user_addresses;

-- If old_addresses > new_addresses, migration is needed
```

### Step 4: Update the View (if needed)
The view might need to be recreated to use the correct table references.

## Immediate Fix Options

### Option A: Quick Fix - Use Direct Query
Modify the collector app to use a direct query instead of the view:

```typescript
// In supabase-services.ts, replace the view query with:
const { data, error } = await supabase
  .from('profiles')
  .select(`
    *,
    user_addresses(*)
  `)
  .eq('role', 'member')
  .eq('is_active', true);
```

### Option B: Fix the View
Update the `collection_member_user_addresses_view` to ensure it uses the correct table references.

### Option C: Data Migration
Migrate any missing addresses from the old `addresses` table to `user_addresses`.

## Testing the Fix

1. **Run Debug Script**: Execute `debug-address-id-issue.sql` to understand the data state
2. **Check View Data**: Verify that the view returns valid address IDs
3. **Test Popup Save**: Try saving a collection to see if the error persists
4. **Verify Data**: Check that the pickup is created successfully

## Expected Results

After fixing the address ID mismatch:
- ✅ The popup save will work without foreign key errors
- ✅ Address IDs will be valid and exist in `user_addresses`
- ✅ Collections will be saved successfully
- ✅ No more "Key not present in table" errors

## Files to Check/Modify

1. **Database View**: `collection_member_user_addresses_view`
2. **Service Function**: `WozaMaliOffice/collector-app/src/lib/supabase-services.ts` (lines 93-185)
3. **Debug Script**: `WozaMaliOffice/debug-address-id-issue.sql`

## Next Steps

1. Run the debug script to understand the current data state
2. Identify whether it's a view issue or data migration issue
3. Apply the appropriate fix based on the findings
4. Test the popup save functionality

The address ID mismatch is the root cause of the popup save issue!
