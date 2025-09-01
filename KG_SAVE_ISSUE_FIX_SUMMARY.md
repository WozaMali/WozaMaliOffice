# Kilograms Save Issue Fix Summary

## Issue
When inputting kilograms (kgs) on a member's profile in the collector app, the data is not being saved.

## Root Cause Analysis
The issue is caused by the foreign key constraint mismatch in the `pickups` table:

1. **User Action**: Input kilograms for materials and click "Save Collection"
2. **App Process**: Tries to create a pickup with `address_id` from `user_addresses` table
3. **Database Error**: Foreign key constraint `pickups_address_id_fkey` still points to old `addresses` table
4. **Result**: Pickup creation fails, no data is saved

## Error Flow
```
User inputs kgs → Save Collection → Create Pickup → Foreign Key Error → Save Fails
```

## Fix Required

### Step 1: Fix Database Foreign Key Constraint
**File**: `fix-pickup-address-schema.sql`

**Action**: Run this SQL script to fix the foreign key constraint:
```sql
\i fix-pickup-address-schema.sql
```

This will:
- Drop the old foreign key constraint pointing to `addresses` table
- Add new foreign key constraint pointing to `user_addresses` table
- Verify the fix worked

### Step 2: Enhanced Debugging Added
**File**: `collector-app/src/app/customers/page.tsx`

**Added comprehensive logging** to track:
- Pickup creation process
- Material data being saved
- Pickup items creation
- Success/failure points

## Expected Results After Fix

After running the database fix:

1. **✅ Pickup Creation**: Should work without foreign key errors
2. **✅ Material Data**: Kilograms should be saved successfully
3. **✅ Collection Records**: Full collection data should be stored
4. **✅ User Feedback**: Success message should appear

## Testing Steps

### Step 1: Apply Database Fix
```sql
\i fix-pickup-address-schema.sql
```

### Step 2: Test Collection Save
1. Open collector app
2. Select a member with an address
3. Click "Record Collection"
4. Input kilograms for materials
5. Click "Save Collection"
6. Check browser console for debug messages
7. Verify success message appears

### Step 3: Verify Data Saved
1. Check that the collection dialog closes
2. Verify member data refreshes
3. Confirm no error messages in console

## Debug Messages to Look For

**Success Flow**:
```
🔍 About to call pickupServices.createPickup...
✅ Pickup created successfully: [pickup object]
🔍 Creating pickup items for materials: [materials array]
🔍 About to add pickup items: [pickup items array]
✅ Pickup items added successfully
```

**Failure Flow**:
```
❌ Supabase error creating pickup: [error details]
❌ Pickup creation failed - pickup is null
```

## Files Modified

1. **`fix-pickup-address-schema.sql`** - Database foreign key fix
2. **`collector-app/src/app/customers/page.tsx`** - Enhanced debugging and error handling

## Why This Happened

The collector app was updated to use the new `user_addresses` schema, but the database foreign key constraint wasn't updated to match. This created a mismatch where:
- The app tries to reference `user_addresses.id`
- But the database constraint still checks `addresses.id`

## Next Steps

1. **Run the database fix script**
2. **Test the collection save functionality**
3. **Verify kilograms are being saved properly**
4. **Check that all collection data is stored correctly**

The kilograms save issue should be resolved once the foreign key constraint is fixed!
