# Fix Summary for Collections Delete and Team Members Approval

## Issues Fixed

### 1. ✅ Team Members Page - Missing Approve/Reject Buttons
**Problem**: Approve/reject buttons were not showing for pending Collector signups.

**Root Cause**: 
- The `TeamMemberCard` component was checking for uppercase role names (`COLLECTOR`, `STAFF`) but the data was coming in lowercase
- The Team Members page wasn't loading pending collectors separately

**Solution Applied**:
- Updated `TeamMemberCard.tsx` to check for both uppercase and lowercase role names
- Added `pending_approval` status to the pending check logic
- Added a separate `loadPendingCollectors()` function to the Team Members page
- Added a dedicated "Pending Collector Approvals" section in the UI
- Updated approve/reject functions to refresh both main list and pending collectors

**Files Modified**:
- `WozaMaliOffice/src/components/admin/TeamMemberCard.tsx`
- `WozaMaliOffice/src/app/admin/team-members/page.tsx`

### 2. 🔧 Collections Page - Delete Functionality
**Problem**: Collections page delete was not working and not sending transactions to deleted_transactions table.

**Root Cause**: 
- The `deleted_transactions` table doesn't exist in the database
- The `soft_delete_collection` function doesn't exist or has permission issues
- Missing `has_any_role` helper function

**Solution Required**:
- Run the SQL script `APPLY_SOFT_DELETE_FIX.sql` in Supabase SQL Editor
- This will create:
  - `deleted_transactions` table
  - `has_any_role` helper function
  - `soft_delete_collection` RPC function
  - Proper RLS policies and permissions

**Files Created**:
- `WozaMaliOffice/APPLY_SOFT_DELETE_FIX.sql` - Complete SQL fix to run in Supabase
- `WozaMaliOffice/test-soft-delete.js` - Test script to verify functionality
- `WozaMaliOffice/setup-soft-delete.js` - Setup script (requires exec_sql function)

## Next Steps

1. **Apply the SQL Fix**:
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `APPLY_SOFT_DELETE_FIX.sql`
   - Run the script

2. **Test the Fixes**:
   - Test Team Members page: Sign up as a collector and verify approve/reject buttons appear
   - Test Collections page: Try deleting a collection and verify it moves to deleted_transactions

3. **Verify Permissions**:
   - Ensure the current user has admin or super_admin role in the `user_roles` table
   - If not, add the role manually

## Files to Run in Supabase SQL Editor

```sql
-- Copy the entire contents of APPLY_SOFT_DELETE_FIX.sql and run it
```

## Testing

After applying the SQL fix, you can test the soft delete functionality:

```bash
cd WozaMaliOffice
node test-soft-delete.js
```

This will test if the soft delete function works properly with a real collection.
