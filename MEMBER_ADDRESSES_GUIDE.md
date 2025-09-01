# Member Addresses Guide

## Overview
This guide explains the member addresses table structure and provides views for both the collection app and office app to access member address data.

## Address Table Structure

The `addresses` table has evolved and may have different column structures depending on the schema version:

### Current Structure (Office Schema)
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),  -- Links to member profile
  street_address TEXT NOT NULL,              -- Main address line
  suburb TEXT,                               -- Suburb/area
  city TEXT NOT NULL,                        -- City
  postal_code TEXT,                          -- Postal/ZIP code
  latitude DECIMAL(10,8),                    -- GPS latitude
  longitude DECIMAL(11,8),                   -- GPS longitude
  is_primary BOOLEAN DEFAULT FALSE,          -- Primary address flag
  is_active BOOLEAN DEFAULT TRUE,            -- Active status
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Legacy Structure (Collector Schema)
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),   -- Links to member profile
  line1 TEXT NOT NULL,                       -- Main address line
  suburb TEXT NOT NULL,                      -- Suburb/area
  city TEXT NOT NULL,                        -- City
  postal_code TEXT,                          -- Postal/ZIP code
  lat DOUBLE PRECISION,                      -- GPS latitude
  lng DOUBLE PRECISION,                      -- GPS longitude
  is_primary BOOLEAN DEFAULT FALSE,          -- Primary address flag
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## Available Views

### 1. `member_addresses_view`
**Purpose**: Unified view that works with both column structures
**Use Case**: General member address queries

```sql
SELECT * FROM member_addresses_view WHERE member_id = 'uuid-here';
```

**Key Fields**:
- `member_id` - Unified member ID (customer_id or profile_id)
- `address_line1` - Unified address line (street_address or line1)
- `formatted_address` - Complete formatted address string
- `short_address` - Short address for lists
- `is_primary` - Primary address flag
- `member_is_active` - Member active status

### 2. `collection_member_addresses_view`
**Purpose**: Simplified view for collection app
**Use Case**: Collection app member address display

```sql
SELECT * FROM collection_member_addresses_view 
WHERE customer_status = 'active';
```

**Key Fields**:
- `address_id` - Address ID
- `member_id` - Member ID
- `member_name` - Member full name
- `member_phone` - Member phone number
- `display_address` - Formatted address for display
- `customer_status` - 'new_customer', 'active', 'inactive', 'dormant'
- `total_collections` - Number of collections from this address

### 3. `office_member_addresses_view`
**Purpose**: Comprehensive view for office app
**Use Case**: Office app member management

```sql
SELECT * FROM office_member_addresses_view 
WHERE total_pickups > 0 
ORDER BY last_pickup_date DESC;
```

**Key Fields**:
- All member profile information
- Complete address details
- `full_address` - Complete formatted address
- Collection statistics (total_pickups, completed_pickups, etc.)
- Financial statistics (total_kg_collected, total_value_collected)
- Wallet information (balance, points, tier)

### 4. `member_addresses_with_pickups_view`
**Purpose**: Addresses with pickup statistics
**Use Case**: Detailed pickup analysis

```sql
SELECT * FROM member_addresses_with_pickups_view 
WHERE total_pickups > 0;
```

## Usage Examples

### For Collection App
```sql
-- Get active member addresses for collection
SELECT 
    address_id,
    member_name,
    member_phone,
    display_address,
    latitude,
    longitude,
    customer_status
FROM collection_member_addresses_view 
WHERE customer_status IN ('active', 'new_customer')
ORDER BY is_primary DESC, last_collection_date ASC;
```

### For Office App
```sql
-- Get member addresses with collection history
SELECT 
    member_id,
    full_name,
    email,
    phone,
    full_address,
    total_pickups,
    completed_pickups,
    total_value_collected,
    wallet_balance,
    tier
FROM office_member_addresses_view 
WHERE member_is_active = true
ORDER BY total_value_collected DESC;
```

### For Address Management
```sql
-- Get all addresses for a specific member
SELECT 
    address_id,
    address_line1,
    suburb,
    city,
    formatted_address,
    is_primary,
    total_pickups
FROM member_addresses_view 
WHERE member_id = 'member-uuid-here'
ORDER BY is_primary DESC, created_at ASC;
```

## Key Features

### 1. **Current Structure Support**
The views are designed for the current addresses table structure using `customer_id` and `street_address` columns.

### 2. **Formatted Addresses**
Multiple address formats are provided:
- `formatted_address` - Complete address with all components
- `short_address` - Address with suburb only
- `display_address` - Optimized for UI display
- `full_address` - Complete formatted address

### 3. **Status Indicators**
- `customer_status` - Activity level based on collection history
- `member_is_active` - Member account status
- `address_is_active` - Address status

### 4. **Collection Statistics**
- Total pickups and completion rates
- Financial summaries (kg collected, value earned)
- Recent activity dates

### 5. **Geolocation Support**
- `latitude` and `longitude` fields for mapping
- GPS coordinates for route optimization

## Best Practices

### 1. **Use Appropriate Views**
- Collection app: Use `collection_member_addresses_view`
- Office app: Use `office_member_addresses_view`
- General queries: Use `member_addresses_view`

### 2. **Filter by Status**
Always filter by `member_is_active = true` and `customer_status` as needed.

### 3. **Handle Primary Addresses**
Use `is_primary = true` to get the main address for a member.

### 4. **Consider Performance**
The views include JOINs and aggregations. For high-frequency queries, consider creating indexes on frequently filtered columns.

## Permissions
All views have `SELECT` permissions granted to the `authenticated` role. Ensure your RLS policies are properly configured for the underlying tables.

## Troubleshooting

### Common Issues
1. **Missing addresses**: Check if `member_is_active = true`
2. **Column structure**: The views use the current structure with `customer_id` and `street_address`
3. **Performance issues**: Consider adding indexes on filtered columns

### Verification Queries
Run the verification queries in `check-member-addresses.sql` to ensure the views are working correctly.
