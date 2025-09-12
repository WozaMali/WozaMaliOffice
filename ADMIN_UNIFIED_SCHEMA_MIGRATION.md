# Admin/Office App - Unified Schema Migration Guide

## Overview

The admin/office app has been updated to use the **Unified Collection System** schema instead of the old separate `pickups` and `profiles` tables. This ensures consistency across all apps (User App, Collector App, Office App).

## Key Changes Made

### 1. Database Schema Updates

**Old Schema:**
- `pickups` table with `user_id` column
- `profiles` table for user management
- `pickup_items` table for materials
- `addresses` table for locations

**New Unified Schema:**
- `unified_collections` table with `customer_id` column
- `user_profiles` table for user management
- `collection_materials` table for materials
- `user_addresses` table for locations

### 2. Code Changes Applied

#### **admin-services.ts**
- ✅ Updated `getRecentActivity()` to use `unified_collections` instead of `pickups`
- ✅ Changed column references from `user_id` to `customer_id`
- ✅ Updated to use `user_profiles` instead of `profiles`
- ✅ Improved error handling with detailed logging
- ✅ Added support for collection codes and denormalized customer names

#### **unified-data-service.ts**
- ✅ Updated all queries to use unified schema tables
- ✅ Changed `pickups` → `unified_collections`
- ✅ Changed `profiles` → `user_profiles`
- ✅ Changed `addresses` → `user_addresses`
- ✅ Changed `pickup_items` → `collection_materials`
- ✅ Updated column mappings to match unified schema
- ✅ Updated realtime subscriptions for new table names

### 3. Schema Mapping

| Old Schema | New Unified Schema | Notes |
|------------|-------------------|-------|
| `pickups.user_id` | `unified_collections.customer_id` | Customer reference |
| `pickups.total_kg` | `unified_collections.total_weight_kg` | Weight field |
| `pickups.started_at` | `unified_collections.created_at` | Timestamp field |
| `profiles.role` | `user_profiles.role` | Role field (lowercase) |
| `addresses.line1` | `user_addresses.address_line1` | Address line |
| `pickup_items.kilograms` | `collection_materials.quantity` | Material quantity |

### 4. Status Mapping

| Old Status | New Status | Description |
|------------|------------|-------------|
| `submitted` | `pending` | Initial collection request |
| `approved` | `approved` | Admin approved |
| `rejected` | `rejected` | Admin rejected |
| `in_progress` | `in_progress` | Collector working |
| `completed` | `completed` | Collection finished |

## Migration Steps

### Step 1: Apply Unified Schema
Run the unified schema script in your Supabase SQL Editor:
```sql
-- File: UNIFIED_COLLECTION_SYSTEM.sql
-- This creates all the unified tables and relationships
```

### Step 2: Migrate Existing Data
If you have existing data, you'll need to migrate it:
```sql
-- Example migration (adjust based on your current data)
INSERT INTO unified_collections (
  id, customer_id, collector_id, status, 
  total_weight_kg, total_value, created_at, updated_at
)
SELECT 
  id, user_id, collector_id, status,
  total_kg, total_value, started_at, updated_at
FROM pickups;
```

### Step 3: Update RLS Policies
Ensure the unified schema RLS policies are applied:
```sql
-- The unified schema includes comprehensive RLS policies
-- Make sure they're applied for proper access control
```

### Step 4: Test the Admin Dashboard
1. Start the admin/office app
2. Check the admin dashboard for recent activity
3. Verify that collections are loading properly
4. Test the error handling (should show detailed errors if any issues)

## Benefits of Unified Schema

### 1. **Consistency Across Apps**
- All three apps (User, Collector, Office) use the same data structure
- No more data synchronization issues between apps
- Unified status workflow

### 2. **Better Performance**
- Denormalized fields for quick access (customer_name, pickup_address)
- Optimized indexes for common queries
- Reduced JOIN operations

### 3. **Enhanced Features**
- Collection codes for better tracking
- Comprehensive material tracking
- Environmental impact calculations
- Quality ratings and contamination tracking

### 4. **Improved Error Handling**
- Detailed error logging with specific error codes
- Better debugging information
- Graceful fallbacks for missing data

## Troubleshooting

### Common Issues

1. **"Table does not exist" errors**
   - Ensure the unified schema has been applied
   - Check that all tables are created properly

2. **"Column does not exist" errors**
   - Verify the column mappings are correct
   - Check that the unified schema is up to date

3. **RLS permission errors**
   - Ensure RLS policies are applied
   - Check that admin users have proper roles

4. **Empty error objects**
   - The improved error handling should now show detailed error information
   - Check the browser console for specific error details

### Debug Commands

```sql
-- Check if unified tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('unified_collections', 'user_profiles', 'collection_materials');

-- Check table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'unified_collections' 
ORDER BY ordinal_position;

-- Test basic query
SELECT COUNT(*) FROM unified_collections;
```

## Next Steps

1. **Test the admin dashboard** - Verify all functionality works
2. **Update other components** - Ensure all admin components use the unified schema
3. **Update documentation** - Update any API documentation
4. **Train users** - Inform admin users about any UI changes

## Files Modified

- `WozaMaliOffice/src/lib/admin-services.ts` - Updated to use unified schema
- `WozaMaliOffice/src/lib/unified-data-service.ts` - Updated to use unified schema
- `WozaMaliOffice/debug-pickup-error.sql` - Diagnostic script
- `WozaMaliOffice/fix-pickup-error.sql` - Fix script for old schema issues

The admin/office app is now fully integrated with the unified collection system! 🎉
