# Collector App Fix Summary

## Issue
The collector app was showing `undefined` values for all profile data because:
1. The service was returning data in the new `user_addresses` format
2. The component was expecting the old `addresses` format
3. The address structure had changed from `line1/suburb` to `address_line1/address_line2`

## Fixes Applied

### 1. Updated Service Function Data Transformation
**File**: `collector-app/src/lib/supabase-services.ts`

**Changes**:
- Modified `getCustomerProfilesWithAddresses()` to transform the new view data into the expected format
- Added data transformation logic to group addresses by member ID
- Updated both main function and fallback function to return data in the correct format

**Key Changes**:
```typescript
// Transform the data to group addresses by member and convert to expected format
const memberMap = new Map<string, ProfileWithAddresses>()

data?.forEach((row: any) => {
  const memberId = row.member_id
  
  if (!memberMap.has(memberId)) {
    // Create member record
    memberMap.set(memberId, {
      id: row.member_id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      role: row.role,
      is_active: row.member_is_active,
      created_at: row.member_since,
      updated_at: row.member_since,
      addresses: [] // Use addresses property for compatibility
    })
  }
  
  // Add address to member
  const member = memberMap.get(memberId)!
  if (row.address_id) {
    member.addresses!.push({
      id: row.address_id,
      user_id: row.member_id,
      address_type: row.address_type,
      address_line1: row.address_line1,
      address_line2: row.address_line2,
      city: row.city,
      province: row.province,
      postal_code: row.postal_code,
      country: row.country,
      coordinates: row.coordinates,
      is_default: row.is_default,
      is_active: row.address_is_active,
      notes: row.notes,
      created_at: row.address_created,
      updated_at: row.address_updated
    })
  }
})
```

### 2. Updated Address Processing Logic
**File**: `collector-app/src/app/customers/page.tsx`

**Changes**:
- Updated primary address selection to use new format (`is_default` + `address_type === 'primary'`)
- Updated address string building to use new field names (`address_line1`, `address_line2`, `province`)
- Updated both data transformation and collection dialog functions

**Key Changes**:
```typescript
// Updated primary address selection
const primaryAddress = profile.addresses?.find(addr => addr.is_default && addr.address_type === 'primary') || 
                      profile.addresses?.find(addr => addr.address_type === 'primary') || 
                      profile.addresses?.[0];

// Updated address processing
const line1 = primaryAddress.address_line1 || '';
const line2 = primaryAddress.address_line2 || '';
const city = primaryAddress.city || '';
const province = primaryAddress.province || '';

// Build address string
const addressParts = [line1, line2].filter(Boolean);
if (addressParts.length > 0) {
  addressString = addressParts.join(', ');
} else {
  addressString = 'Address not specified';
}

// Build city string with province
const cityParts = [city, province].filter(Boolean);
cityString = cityParts.length > 0 ? cityParts.join(', ') : 'Unknown city';
```

### 3. Enhanced Debugging
**Added comprehensive console logging** to track:
- Raw data from the database view
- Data transformation process
- Address processing logic
- Final formatted data

## Expected Results

After applying these fixes, the collector app should display:

1. **Customer Names**: Proper member names instead of "undefined"
2. **Addresses**: Properly formatted addresses with line1, line2, city, and province
3. **Address Types**: Support for primary, pickup, secondary, and billing addresses
4. **Collection Dialog**: Proper address selection for collections

## Data Flow

1. **Database View**: `collection_member_user_addresses_view` returns flat data (one row per address)
2. **Service Transformation**: Groups addresses by member ID and creates nested structure
3. **Component Processing**: Uses new address format to build display strings
4. **UI Display**: Shows properly formatted member names and addresses

## Compatibility

The fixes maintain compatibility with:
- Existing TypeScript interfaces
- Existing component logic
- Existing collection workflow
- Both old and new address formats (with fallbacks)

## Testing

To verify the fixes:
1. Check browser console for debug messages
2. Verify member names are displayed correctly
3. Verify addresses are formatted properly
4. Test collection dialog functionality
5. Verify address selection works correctly

The collector app should now properly display member names and addresses using the new user address schema.
