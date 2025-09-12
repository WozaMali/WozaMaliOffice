# Column Name Fix Applied

## Issue
The SQL error showed that the `user_addresses` table doesn't have a `profile_id` column:
```
ERROR: 42703: column ua.profile_id does not exist
```

## Root Cause
The service functions were using `profile_id` to reference the user in the `user_addresses` table, but the actual column name is `user_id`.

## Fix Applied

### 1. Updated Service Functions
Fixed the `getCustomerProfilesWithAddressesFallback` function to use the correct column name:

```typescript
// BEFORE (incorrect):
const memberAddresses = userAddresses?.filter(addr => addr.profile_id === profile.id) || [];

// AFTER (correct):
const memberAddresses = userAddresses?.filter(addr => addr.user_id === profile.id) || [];
```

### 2. Updated Address Services
Fixed the `getAddressesByProfile` function:

```typescript
// BEFORE (incorrect):
.eq('profile_id', profileId)

// AFTER (correct):
.eq('user_id', profileId)
```

### 3. Updated Address Mapping
Fixed the address mapping in the fallback function:

```typescript
// BEFORE (incorrect):
user_id: addr.profile_id, // Map profile_id to user_id for compatibility

// AFTER (correct):
user_id: addr.user_id, // Use user_id directly
```

### 4. Updated Debug SQL Script
Fixed all SQL queries in the debug script to use `user_id` instead of `profile_id`:

```sql
-- BEFORE (incorrect):
LEFT JOIN public.user_addresses ua ON p.id = ua.profile_id

-- AFTER (correct):
LEFT JOIN public.user_addresses ua ON p.id = ua.user_id
```

## Files Modified

### `WozaMaliOffice/collector-app/src/lib/supabase-services.ts`
- ✅ Fixed `getCustomerProfilesWithAddressesFallback` function
- ✅ Fixed `getAddressesByProfile` function
- ✅ Updated address mapping logic

### `WozaMaliOffice/debug-address-display-issue.sql`
- ✅ Fixed all SQL queries to use correct column name
- ✅ Updated JOIN conditions
- ✅ Updated SELECT statements

## Testing Steps

1. **Run the debug SQL script** to verify the column names are correct
2. **Refresh the collector app**
3. **Navigate to the Members page**
4. **Check if addresses are now showing up correctly**
5. **Test the popup save functionality**

## Expected Results

After this fix:
- ✅ **No more SQL column errors**
- ✅ **Addresses should display in member cards**
- ✅ **Popup should show address information**
- ✅ **"Record Collection" button should be available**
- ✅ **Popup save should work correctly**

## The Complete Fix

The issue was a simple column name mismatch:
- **Service functions**: Were using `profile_id` ❌
- **Database table**: Actually uses `user_id` ✅
- **Solution**: Update all references to use `user_id` ✅

The address display and popup save functionality should now work correctly! 🎉