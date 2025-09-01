# Pickup Foreign Key Fix Summary

## Issue
The collector app was failing to create pickups with the error:
```
insert or update on table "pickups" violates foreign key constraint "pickups_address_id_fkey"
Key is not present in table "addresses".
```

## Root Cause
The `pickups` table still had a foreign key constraint pointing to the old `addresses` table, but the application was now using the new `user_addresses` table.

## Problem Details
1. **Old Foreign Key**: `pickups.address_id` → `addresses.id`
2. **New Schema**: Addresses are now stored in `user_addresses` table
3. **Service Updated**: The collector app service was already updated to use `user_addresses`
4. **Constraint Mismatch**: The database constraint was still pointing to the old table

## Fix Applied

### Database Schema Update
**File**: `fix-pickup-address-schema.sql`

**Changes**:
1. **Dropped Old Constraint**: Removed `pickups_address_id_fkey` pointing to `addresses` table
2. **Added New Constraint**: Created new `pickups_address_id_fkey` pointing to `user_addresses` table
3. **Added Safety**: Used `ON DELETE SET NULL` to handle address deletions gracefully

**SQL Changes**:
```sql
-- Drop the old foreign key constraint
ALTER TABLE public.pickups DROP CONSTRAINT IF EXISTS pickups_address_id_fkey;

-- Add new foreign key constraint to user_addresses table
ALTER TABLE public.pickups 
ADD CONSTRAINT pickups_address_id_fkey 
FOREIGN KEY (address_id) REFERENCES public.user_addresses(id) ON DELETE SET NULL;
```

## Verification Steps

### Step 1: Run the Database Fix
```sql
\i fix-pickup-address-schema.sql
```

### Step 2: Verify the Constraint
The script will show:
- Current pickup table structure
- Old foreign key constraints (before fix)
- New foreign key constraints (after fix)
- Sample data for testing

### Step 3: Test Pickup Creation
After running the fix, the collector app should be able to:
- Create new pickups successfully
- Reference addresses from the `user_addresses` table
- Handle address deletions gracefully

## Expected Results

After applying the fix:

1. **✅ Pickup Creation**: Should work without foreign key errors
2. **✅ Address References**: Should correctly reference `user_addresses` table
3. **✅ Data Integrity**: Foreign key constraint ensures valid address references
4. **✅ Graceful Handling**: Address deletions won't break existing pickups

## Data Flow

1. **Address Selection**: Collector app selects address from `user_addresses` table
2. **Pickup Creation**: Service creates pickup with `address_id` from `user_addresses`
3. **Foreign Key Check**: Database validates `address_id` exists in `user_addresses`
4. **Success**: Pickup is created successfully

## Testing

To verify the fix:
1. Run the database schema update script
2. Try creating a pickup in the collector app
3. Verify no foreign key constraint errors
4. Check that the pickup is created successfully
5. Verify the pickup references the correct address

## Files Modified

1. **`fix-pickup-address-schema.sql`** - Database schema fix
2. **`check-pickup-table.sql`** - Diagnostic script to check current state

## Notes

- The collector app service was already updated to use `user_addresses`
- The issue was purely a database constraint mismatch
- No application code changes were needed
- The fix maintains data integrity while enabling the new schema

The pickup creation should now work correctly with the new user address schema!
