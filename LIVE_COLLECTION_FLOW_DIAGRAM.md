# Live Collection Information Flow After Save

## Complete Data Flow from Collector App to Database and Beyond

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LIVE COLLECTION SAVE FLOW                            │
└─────────────────────────────────────────────────────────────────────────────────┘

1. COLLECTOR APP (Frontend)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ LiveCollectionPopup.tsx - handleSubmit()                                   │
   │ ├─ Validates customer selection                                            │
   │ ├─ Validates materials (weight > 0)                                        │
   │ ├─ Prepares collection data                                                │
   │ ├─ Gets customer address ID                                                │
   │ └─ Calls submitLiveCollection()                                            │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. COLLECTION SERVICE (Backend)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ collection-services.ts - submitLiveCollection()                            │
   │ ├─ Step 1: Create pickup record in 'pickups' table                        │
   │ │   ├─ customer_id, collector_id, address_id                              │
   │ │   ├─ status: 'submitted'                                                │
   │ │   ├─ timestamps: started_at, submitted_at                               │
   │ │   └─ coordinates: lat, lng                                              │
   │ │                                                                          │
   │ ├─ Step 2: Create pickup items in 'pickup_items' table                    │
   │ │   ├─ For each material: material_id, kilograms, contamination_pct       │
   │ │   └─ Links to pickup record                                             │
   │ │                                                                          │
   │ ├─ Step 3: Save photos in 'pickup_photos' table (optional)                │
   │ │   ├─ scale_photo, recyclables_photo                                     │
   │ │   └─ Links to pickup record                                             │
   │ │                                                                          │
   │ ├─ Step 4: Fetch updated pickup with calculated totals                    │
   │ │   └─ Database triggers calculate total_kg and total_value               │
   │ │                                                                          │
   │ ├─ Step 5: Calculate environmental impact                                  │
   │ │   ├─ CO2 saved, water saved, landfill saved                             │
   │ │   ├─ Trees equivalent (22kg CO2 = 1 tree)                               │
   │ │   └─ Based on materials table data                                      │
   │ │                                                                          │
   │ ├─ Step 6: Calculate points earned                                        │
   │ │   ├─ Based on material value and points_per_rand                        │
   │ │   └─ Bonus for large quantities (≥10kg)                                 │
   │ │                                                                          │
   │ ├─ Step 7: Calculate fund allocation                                      │
   │ │   ├─ Aluminium: 100% to customer wallet                                 │
   │ │   ├─ PET/Plastic: 100% to Green Scholar Fund                           │
   │ │   └─ Other materials: 70% Green Scholar, 30% Customer Wallet            │
   │ │                                                                          │
   │ └─ Step 8: Update customer wallet                                         │
   │     ├─ Insert into 'wallet_ledger' table                                  │
   │     ├─ points, zar_amount, description                                    │
   │     └─ Links to pickup_id                                                 │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. DATABASE TRIGGERS (Automatic Processing)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ Database Triggers (PostgreSQL)                                            │
   │ ├─ update_pickup_totals() trigger                                         │
   │ │   ├─ Calculates total_kg from pickup_items                             │
   │ │   ├─ Calculates total_value from pickup_items                          │
   │ │   └─ Updates pickup record automatically                               │
   │ │                                                                          │
   │ ├─ update_member_profile_on_collection() trigger                         │
   │ │   ├─ Updates member's wallet balance                                   │
   │ │   ├─ Updates total_points earned                                       │
   │ │   ├─ Updates tier (Bronze → Silver → Gold → Platinum → Diamond)        │
   │ │   └─ Creates/updates wallet record                                     │
   │ │                                                                          │
   │ └─ update_collector_metrics() trigger (if exists)                        │
   │     ├─ Updates collector's performance metrics                            │
   │     ├─ Updates collection statistics                                      │
   │     └─ Updates zone analytics                                             │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
4. REAL-TIME UPDATES (WebSocket/Realtime)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ Real-time Notifications                                                    │
   │ ├─ Customer App: Collection submitted notification                        │
   │ ├─ Office App: New collection for review                                  │
   │ ├─ Collector App: Collection confirmation                                 │
   │ └─ Admin Dashboard: Collection metrics update                             │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
5. DATA PERSISTENCE (Multiple Tables)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ Database Tables Updated                                                    │
   │ ├─ pickups: Main collection record                                        │
   │ ├─ pickup_items: Individual material records                              │
   │ ├─ pickup_photos: Photo attachments                                       │
   │ ├─ wallet_ledger: Customer wallet transactions                            │
   │ ├─ wallets: Customer wallet balances                                      │
   │ ├─ user_profiles: Member tier updates                                     │
   │ ├─ collection_metrics: Performance tracking                               │
   │ └─ zone_analytics: Zone performance data                                  │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
6. FRONTEND UPDATES (User Interface)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ UI Updates and Notifications                                               │
   │ ├─ Collector App:                                                          │
   │ │   ├─ Success message with collection summary                            │
   │ │   ├─ Environmental impact display                                       │
   │ │   ├─ Fund allocation breakdown                                          │
   │ │   ├─ Form reset and popup close                                         │
   │ │   └─ Collection list refresh                                            │
   │ │                                                                          │
   │ ├─ Customer App:                                                          │
   │ │   ├─ Collection history update                                          │
   │ │   ├─ Wallet balance update                                              │
   │ │   ├─ Points earned notification                                         │
   │ │   └─ Environmental impact summary                                       │
   │ │                                                                          │
   │ └─ Office App:                                                            │
   │     ├─ New collection in review queue                                     │
   │     ├─ Collection metrics update                                          │
   │     ├─ Customer profile update                                            │
   │     └─ Dashboard statistics refresh                                       │
   └─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
7. BACKGROUND PROCESSING (Async Tasks)
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ Background Processing                                                       │
   │ ├─ Email Notifications:                                                   │
   │ │   ├─ Customer: Collection confirmation email                            │
   │ │   ├─ Office: New collection for review                                  │
   │ │   └─ Collector: Collection submission confirmation                      │
   │ │                                                                          │
   │ ├─ Analytics Updates:                                                     │
   │ │   ├─ System-wide metrics                                                │
   │ │   ├─ Zone performance analytics                                         │
   │ │   ├─ Material performance tracking                                      │
   │ │   └─ Environmental impact aggregation                                   │
   │ │                                                                          │
   │ └─ Data Aggregation:                                                      │
   │     ├─ Daily/weekly/monthly reports                                       │
   │     ├─ Performance dashboards                                             │
   │     └─ Financial reconciliation                                           │
   └─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              END OF FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Data Transformations

### 1. **Collection Data Structure**
```typescript
// Input (from Collector App)
LiveCollectionData {
  customer_id: string
  address_id: string
  materials: CollectionMaterial[]
  notes: string
  scale_photo?: string
  recyclables_photo?: string
  lat?: number
  lng?: number
}

// Output (to Database)
CollectionResult {
  pickup_id: string
  total_kg: number
  total_value: number
  environmental_impact: {
    co2_saved: number
    water_saved: number
    landfill_saved: number
    trees_equivalent: number
  }
  points_earned: number
  fund_allocation: {
    green_scholar_fund: number
    user_wallet: number
  }
}
```

### 2. **Database Tables Updated**
- **`pickups`**: Main collection record
- **`pickup_items`**: Individual material entries
- **`pickup_photos`**: Photo attachments
- **`wallet_ledger`**: Customer wallet transactions
- **`wallets`**: Customer wallet balances
- **`user_profiles`**: Member tier updates

### 3. **Calculations Performed**
- **Weight**: Sum of all material kilograms
- **Value**: Material weight × rate_per_kg
- **Points**: Value × points_per_rand (with bonuses)
- **Environmental Impact**: Based on material CO2/water/landfill factors
- **Fund Allocation**: Based on material type rules

### 4. **Real-time Updates**
- WebSocket notifications to all connected clients
- UI refreshes across all apps
- Dashboard metric updates
- Collection list updates

## Error Handling and Recovery

### 1. **Timeout Prevention**
- 25-second timeout for collection creation
- 20-second timeout for live collection submission
- Progress indicators during long operations

### 2. **Error Categories**
- **Network errors**: Retry with user feedback
- **Database errors**: Specific error messages
- **Validation errors**: Field-specific feedback
- **Timeout errors**: Clear timeout messaging

### 3. **Data Consistency**
- Database transactions ensure atomicity
- Rollback on failure
- Partial success handling (photos optional)
- Wallet updates are non-blocking

## Performance Optimizations

### 1. **Database Level**
- Indexes on frequently queried columns
- Batch operations for materials
- Optimized triggers
- Connection pooling

### 2. **Application Level**
- Timeout handling
- Progress indicators
- Error categorization
- Resource cleanup

### 3. **Real-time Updates**
- Efficient WebSocket usage
- Selective UI updates
- Debounced refresh operations
- Background processing

This flow ensures that every live collection save is properly processed, tracked, and reflected across all parts of the WozaMali system while maintaining data consistency and providing excellent user experience.
