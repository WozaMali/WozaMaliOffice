# Collector App Address Schema Update

## Overview
Updated the collector app to use the new `user_addresses` schema instead of the legacy `addresses` table with `profile_id`.

## Files Updated

### 1. `collector-app/src/lib/supabase-services.ts`

#### Profile Services
- **Updated `getCustomerProfilesWithAddresses()`**: Now uses `collection_member_user_addresses_view` instead of the old `addresses` table
- **Updated fallback method**: Uses `user_addresses` table with `user_id` instead of `addresses` with `profile_id`

#### Address Services
- **Updated `getAddressesByProfile()`**: Now queries `user_addresses` table with `user_id` and `is_active` filter
- **Updated `createAddress()`**: Now inserts into `user_addresses` table
- **Updated `updateAddress()`**: Now updates `user_addresses` table
- **Added new functions**:
  - `getUserAddresses()`: Uses the `get_user_addresses` RPC function
  - `setDefaultAddress()`: Uses the `set_default_address` RPC function
  - `getDefaultAddress()`: Uses the `get_default_address` RPC function

#### Pickup Services
- **Updated `getPickupWithDetails()`**: Now uses `pickup_address:user_addresses!pickups_pickup_address_id_fkey(*)` instead of `address:addresses(*)`

### 2. `collector-app/src/lib/supabase.ts`

#### Type Definitions
- **Updated `Address` interface**:
  - Changed `profile_id` → `user_id`
  - Changed `line1` → `address_line1`
  - Added `address_line2`, `province`, `country`, `coordinates`, `is_default`, `is_active`, `notes`
  - Added `address_type` with values: `'primary' | 'secondary' | 'pickup' | 'billing'`
  - Added `created_at`, `updated_at` timestamps

- **Updated `Pickup` interface**:
  - Changed `address_id` → `pickup_address_id` (optional)

- **Updated `PickupWithDetails` interface**:
  - Changed `address?` → `pickup_address?`

- **Updated Dashboard View Types**:
  - Changed `line1` → `address_line1`
  - Changed `suburb` → `address_line2`
  - Changed `city` → `city` (kept same)
  - Added `province` field

## Key Changes Summary

### Database Schema Migration
- **From**: `addresses` table with `profile_id`, `line1`, `suburb`, `lat`, `lng`, `is_primary`
- **To**: `user_addresses` table with `user_id`, `address_line1`, `address_line2`, `city`, `province`, `coordinates`, `is_default`, `address_type`

### Service Function Updates
- All address-related functions now use the new `user_addresses` table
- Added support for the new helper functions (`get_user_addresses`, `set_default_address`, `get_default_address`)
- Updated pickup details to use the new address relationship

### Type Safety
- Updated all TypeScript interfaces to match the new schema
- Maintained backward compatibility where possible
- Added new fields for enhanced address management

## Benefits of the Update

1. **Flexible Address Types**: Support for primary, secondary, pickup, and billing addresses
2. **Better Data Structure**: More comprehensive address information with province, country, notes
3. **GPS Coordinates**: Support for precise location data with POINT type
4. **Default Address Management**: Built-in support for setting default addresses per type
5. **Enhanced Security**: Row-level security policies for address access control
6. **Helper Functions**: Database-level functions for common address operations

## Testing Recommendations

1. Test customer profile fetching with addresses
2. Test address creation and updates
3. Test pickup creation with address selection
4. Test default address management
5. Verify dashboard views display correct address information

## Migration Notes

- The old `addresses` table is still available for backward compatibility
- New addresses should be created using the `user_addresses` table
- Existing data can be migrated using the `populate-user-addresses.sql` script
- Views provide a unified interface for both old and new address data
