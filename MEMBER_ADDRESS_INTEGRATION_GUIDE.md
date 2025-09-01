# Member Address Integration Guide

This guide explains how to use the new user address schema with the member page and related components.

## 🎯 Overview

The new address system provides:
- **Flexible address types**: primary, secondary, pickup, billing
- **Multiple addresses per member**: Each member can have multiple addresses of different types
- **Default address management**: One default address per type
- **GPS coordinates**: For route optimization and mapping
- **Enhanced views**: Optimized for both collection and office apps

## 📊 Database Schema

### New Tables and Views

1. **`user_addresses`** - Main address table
2. **`member_user_addresses_view`** - Basic member addresses view
3. **`collection_member_user_addresses_view`** - Collection app optimized view
4. **`office_member_user_addresses_view`** - Office app optimized view

### Key Features

- **Address Types**: `primary`, `secondary`, `pickup`, `billing`
- **Default Management**: Only one default per type per user
- **GPS Support**: POINT coordinates for mapping
- **Active Status**: Soft delete with `is_active` flag
- **Notes**: Additional delivery instructions

## 🔧 Updated Components

### 1. TypeScript Types

```typescript
// New UserAddress interface
export interface UserAddress {
  id: string
  user_id: string
  address_type: 'primary' | 'secondary' | 'pickup' | 'billing'
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code?: string
  country: string
  coordinates?: { x: number; y: number }
  is_default: boolean
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// Enhanced member interface
export interface MemberWithUserAddresses extends Profile {
  user_addresses?: UserAddress[]
  wallet_balance?: number
  total_points?: number
  tier?: string
  total_pickups?: number
  last_pickup_date?: string
}
```

### 2. Services

#### Address Services
```typescript
// Get user addresses
const addresses = await addressServices.getUserAddresses(userId);

// Create new address
const newAddress = await addressServices.createUserAddress({
  user_id: userId,
  address_type: 'pickup',
  address_line1: '123 Main St',
  city: 'Cape Town',
  province: 'Western Cape',
  is_default: true
});

// Set default address
await addressServices.setDefaultAddress(userId, addressId, 'pickup');

// Get default address
const defaultAddress = await addressServices.getDefaultAddress(userId, 'pickup');
```

#### Profile Services
```typescript
// Get members with addresses (basic view)
const members = await profileServices.getMemberProfilesWithUserAddresses();

// Get members for collection app
const collectionMembers = await profileServices.getCollectionMemberProfiles();

// Get members for office app
const officeMembers = await profileServices.getOfficeMemberProfiles();
```

### 3. React Hooks

#### useMemberProfiles Hook
```typescript
const {
  members,
  filteredMembers,
  statistics,
  loading,
  error,
  searchMembers,
  addAddressToMember,
  updateMemberAddress,
  setDefaultAddress,
  getDefaultAddress,
  refreshMembers
} = useMemberProfiles();
```

### 4. Components

#### MemberManagement Component
- **Location**: `src/components/member/MemberManagement.tsx`
- **Features**:
  - Member list with address summaries
  - Search and filtering by address type
  - Member detail modal with full address management
  - Statistics dashboard
  - Address type icons and badges

#### AddressForm Component
- **Location**: `src/components/member/AddressForm.tsx`
- **Features**:
  - Form for adding/editing addresses
  - Address type selection
  - Default address management
  - Validation and error handling

#### CustomerManagementNew Component
- **Location**: `src/components/collector/CustomerManagementNew.tsx`
- **Features**:
  - Collection app optimized member view
  - Pickup address highlighting
  - Customer status management
  - Collection-ready indicators

## 🚀 Usage Examples

### 1. Display Member with Addresses

```typescript
import { useMemberProfiles } from '@/hooks/use-member-profiles';

function MemberList() {
  const { members, loading } = useMemberProfiles();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          <h3>{member.full_name}</h3>
          {member.user_addresses?.map(address => (
            <div key={address.id}>
              <span>{address.address_type}: {address.address_line1}</span>
              {address.is_default && <span> (Default)</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 2. Add New Address

```typescript
import { addressServices } from '@/lib/supabase-services';

async function addPickupAddress(memberId: string) {
  const newAddress = await addressServices.createUserAddress({
    user_id: memberId,
    address_type: 'pickup',
    address_line1: '456 Collection St',
    city: 'Cape Town',
    province: 'Western Cape',
    postal_code: '8001',
    country: 'South Africa',
    is_default: true,
    is_active: true,
    notes: 'Call when arriving'
  });

  if (newAddress) {
    console.log('Address added successfully');
  }
}
```

### 3. Search Members by Address Type

```typescript
import { useMemberProfiles } from '@/hooks/use-member-profiles';

function SearchByPickupAddress() {
  const { searchMembers } = useMemberProfiles();

  const findMembersWithPickupAddresses = () => {
    searchMembers({
      addressType: 'pickup',
      hasAddress: true
    });
  };

  return (
    <button onClick={findMembersWithPickupAddresses}>
      Find Members with Pickup Addresses
    </button>
  );
}
```

## 📱 App-Specific Views

### Collection App
- **View**: `collection_member_user_addresses_view`
- **Focus**: Pickup addresses, collection readiness
- **Features**: Customer status, pickup history, collection metrics

### Office App
- **View**: `office_member_user_addresses_view`
- **Focus**: Complete member management, all address types
- **Features**: Wallet balance, tier management, comprehensive stats

## 🔍 Address Type Usage

### Primary Address
- **Purpose**: Main residence or business address
- **Usage**: Default contact address, billing
- **Icon**: Home

### Secondary Address
- **Purpose**: Alternative address
- **Usage**: Backup location, seasonal addresses
- **Icon**: Building

### Pickup Address
- **Purpose**: Waste collection location
- **Usage**: Collection scheduling, route planning
- **Icon**: Truck

### Billing Address
- **Purpose**: Invoice and payment address
- **Usage**: Financial transactions, tax purposes
- **Icon**: CreditCard

## 🎨 UI Components

### Address Type Badges
```typescript
const getAddressTypeColor = (type: string) => {
  switch (type) {
    case 'primary': return 'bg-blue-100 text-blue-800';
    case 'secondary': return 'bg-gray-100 text-gray-800';
    case 'pickup': return 'bg-green-100 text-green-800';
    case 'billing': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### Address Type Icons
```typescript
const getAddressTypeIcon = (type: string) => {
  switch (type) {
    case 'primary': return <Home className="w-4 h-4" />;
    case 'secondary': return <Building className="w-4 h-4" />;
    case 'pickup': return <Truck className="w-4 h-4" />;
    case 'billing': return <CreditCard className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};
```

## 🔧 Migration from Old System

### Legacy Support
The old `addresses` table and related services are still available for backward compatibility:

```typescript
// Legacy address services still work
const legacyAddresses = await addressServices.getAddressesByProfile(profileId);

// New services for enhanced functionality
const userAddresses = await addressServices.getUserAddresses(userId);
```

### Data Migration
Use the `populate-user-addresses.sql` script to migrate existing addresses to the new schema.

## 📊 Statistics and Analytics

### Member Statistics
```typescript
interface MemberStatistics {
  total: number;
  withAddresses: number;
  withoutAddresses: number;
  withPickupAddresses: number;
  withMultipleAddresses: number;
  activeMembers: number;
  inactiveMembers: number;
}
```

### Address Analytics
- Total addresses by type
- Members with multiple addresses
- Collection readiness metrics
- Geographic distribution

## 🚀 Next Steps

1. **Run the population script**: Execute `populate-user-addresses.sql`
2. **Update your components**: Use the new services and hooks
3. **Test the views**: Verify data is displaying correctly
4. **Customize for your needs**: Adapt the components to your specific requirements

## 📝 Notes

- All new services include proper error handling
- The system supports both legacy and new address formats
- GPS coordinates are optional but recommended for route optimization
- Default address management ensures data consistency
- All views are optimized for their specific use cases

## 🆘 Troubleshooting

### Common Issues

1. **Views returning 0 results**: Run the population script
2. **Address type errors**: Ensure you're using the correct enum values
3. **Default address conflicts**: The system automatically manages defaults
4. **Permission errors**: Check RLS policies are properly configured

### Debug Queries

```sql
-- Check if views have data
SELECT COUNT(*) FROM member_user_addresses_view;
SELECT COUNT(*) FROM collection_member_user_addresses_view;
SELECT COUNT(*) FROM office_member_user_addresses_view;

-- Check address types
SELECT address_type, COUNT(*) FROM user_addresses GROUP BY address_type;

-- Check default addresses
SELECT address_type, COUNT(*) FROM user_addresses WHERE is_default = true GROUP BY address_type;
```

This integration provides a robust, flexible address management system that scales with your application needs while maintaining backward compatibility.
