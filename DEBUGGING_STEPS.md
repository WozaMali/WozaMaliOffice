# Debugging Steps for Address Display Issue

## Current Status
- ✅ **Database has addresses** - SQL query shows addresses exist
- ✅ **Column names are correct** - `user_id` not `profile_id`
- ✅ **Foreign key constraint is fixed** - Collections table constraint is correct
- ❌ **Addresses not displaying in app** - Still showing "No address registered"

## Debugging Steps

### 1. Check Browser Console Logs
Open the collector app at `http://localhost:8082/customers` and check the browser console for:

- Service function debug logs
- Any error messages
- Authentication issues
- Network request failures

Look for these specific log messages:
```
🔍 Debug - Starting getCustomerProfilesWithAddresses with direct queries...
🔄 Fallback: Fetching profiles and user_addresses separately...
✅ User authenticated in fallback: [user-id]
✅ Found profiles: [count]
✅ Found addresses: [count]
Profile [email] has [count] addresses
```

### 2. Check Network Tab
In browser DevTools, check the Network tab for:
- Supabase API calls
- Any failed requests
- Response data from profiles and user_addresses queries

### 3. Test Service Function Directly
Run the debug SQL script to verify the data:
```sql
-- Run this in Supabase SQL Editor
\i debug-service-function.sql
```

### 4. Check Authentication
Verify that the user is properly authenticated:
- Check if the user has the correct role (collector/admin)
- Verify the session is active
- Check if RLS policies are blocking the queries

### 5. Check RLS Policies
The issue might be Row Level Security (RLS) policies blocking the queries:
```sql
-- Check RLS policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check RLS policies on user_addresses table  
SELECT * FROM pg_policies WHERE tablename = 'user_addresses';
```

## Possible Issues

### 1. Authentication Issue
- User not properly authenticated
- Session expired
- Wrong user role

### 2. RLS Policy Issue
- RLS policies blocking the queries
- User doesn't have permission to read profiles/addresses

### 3. Service Function Issue
- Function not being called
- Error in the fallback method
- Data transformation issue

### 4. Frontend Issue
- Data not being processed correctly
- Component not rendering addresses
- State management issue

## Next Steps

1. **Check browser console logs** for detailed error messages
2. **Run the debug SQL script** to verify data structure
3. **Check RLS policies** if authentication is working
4. **Test the service function** with the HTML test file
5. **Verify the frontend component** is processing the data correctly

## Expected Console Output

If working correctly, you should see:
```
🔍 Debug - Starting getCustomerProfilesWithAddresses with direct queries...
🔄 Fallback: Fetching profiles and user_addresses separately...
✅ User authenticated in fallback: [user-id]
✅ Found profiles: 12
✅ Found addresses: 12
Profile legacymusicsa@gmail.com has 2 addresses
Profile ramosoeuqueen@gmail.com has 2 addresses
...
✅ Fallback approach successful: { profilesCount: 12, addressesCount: 12, combinedCount: 12 }
```

If you see different output or errors, that will help identify the issue.
