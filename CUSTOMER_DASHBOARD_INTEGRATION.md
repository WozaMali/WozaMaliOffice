# 🎯 Customer Dashboard Integration Guide

## **Overview**
This guide explains how to implement real-time customer dashboard updates when pickups are approved by admins. Since both the admin app and customer dashboard share the same Supabase database, real-time updates happen automatically.

## **🚀 How It Works**

### **1. Unified Database Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin App     │    │   Supabase      │    │ Customer        │
│   (Port 8081)   │◄──►│   Database      │◄──►│ Dashboard       │
│                 │    │                 │    │ (Other Repo)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **2. Real-Time Data Flow**
1. **Admin approves pickup** → Database updated
2. **Supabase triggers** → Real-time notification sent
3. **Customer dashboard receives** → Automatic UI update
4. **No manual refresh needed** → Everything happens instantly

## **📱 Customer Dashboard Implementation**

### **Step 1: Install Supabase Client**
```bash
npm install @supabase/supabase-js
```

### **Step 2: Configure Supabase Connection**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### **Step 3: Create Customer Dashboard Component**
```typescript
// components/CustomerDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Pickup {
  id: string
  status: string
  total_kg: number
  total_value: number
  created_at: string
  approval_note?: string
  address: {
    line1: string
    suburb: string
    city: string
  }
}

export default function CustomerDashboard() {
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadCustomerPickups(user.id)
        setupRealtimeSubscription(user.id)
      }
    }
    getUser()
  }, [])

  const loadCustomerPickups = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          address:addresses(line1, suburb, city)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPickups(data || [])
    } catch (error) {
      console.error('Error loading pickups:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (userId: string) => {
    // Subscribe to changes in the customer's pickups
    const subscription = supabase
      .channel('customer_pickups_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pickups',
          filter: `customer_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('🔄 Pickup update received:', payload)
          
          if (payload.eventType === 'INSERT') {
            // New pickup added
            setPickups(prev => [payload.new as Pickup, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Pickup updated (e.g., status changed to approved)
            setPickups(prev => prev.map(pickup => 
              pickup.id === payload.new.id ? payload.new as Pickup : pickup
            ))
          } else if (payload.eventType === 'DELETE') {
            // Pickup deleted
            setPickups(prev => prev.filter(pickup => pickup.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'submitted':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Recycling Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your recycling progress and earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Collections</h3>
          <p className="text-2xl font-bold text-gray-900">{pickups.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Approved Collections</h3>
          <p className="text-2xl font-bold text-green-600">
            {pickups.filter(p => p.status === 'approved').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Weight</h3>
          <p className="text-2xl font-bold text-blue-600">
            {pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0).toFixed(1)} kg
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
          <p className="text-2xl font-bold text-green-600">
            R{pickups.reduce((sum, p) => sum + (p.total_value || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pickups List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">My Collections</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {pickups.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No collections yet. Start recycling to see your progress here!</p>
            </div>
          ) : (
            pickups.map((pickup) => (
              <div key={pickup.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={getStatusBadge(pickup.status)}>
                        {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(pickup.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {pickup.address?.line1}, {pickup.address?.suburb}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-medium">{pickup.total_kg || 0} kg</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-medium text-green-600">
                          R{pickup.total_value || 0}
                        </p>
                      </div>
                    </div>
                    
                    {pickup.approval_note && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Admin Note:</span> {pickup.approval_note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

## **🔧 Real-Time Subscription Setup**

### **Option 1: Component-Level Subscription (Recommended)**
```typescript
useEffect(() => {
  if (!user) return

  const subscription = supabase
    .channel('customer_pickups_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'pickups',
        filter: `customer_id=eq.${user.id}`
      }, 
      (payload) => {
        console.log('🔄 Real-time update received:', payload)
        // Update your component state here
        handlePickupUpdate(payload)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [user])
```

### **Option 2: Service-Level Subscription**
```typescript
// services/customerService.ts
export class CustomerService {
  static subscribeToPickupUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('customer_pickups_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pickups',
          filter: `customer_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}
```

## **🎯 What Happens When Admin Approves Pickup**

### **1. Admin Action**
- Admin clicks "Approve" button in admin dashboard
- `updatePickupStatus()` function called
- Pickup status changed to "approved" in database
- Approval note saved

### **2. Real-Time Notification**
- Supabase automatically detects the database change
- Real-time notification sent to all subscribed clients
- Customer dashboard receives the update instantly

### **3. Customer Dashboard Update**
- Customer sees pickup status change from "submitted" to "approved"
- Total earnings update automatically
- Collection count increases
- No page refresh needed

## **🧪 Testing the Integration**

### **Step 1: Start Both Apps**
```bash
# Terminal 1 - Admin App
cd woza-mali-office
npm run dev

# Terminal 2 - Customer Dashboard (other repo)
cd customer-dashboard-repo
npm run dev
```

### **Step 2: Test Real-Time Updates**
1. **Login to customer dashboard** with a customer account
2. **Note the current stats** (collections, earnings, etc.)
3. **Login to admin dashboard** in another tab
4. **Find a pickup** submitted by the customer
5. **Click "Approve"** and add a note
6. **Watch the magic happen** ✨ - Customer dashboard updates instantly!

### **Step 3: Verify Updates**
- Customer dashboard should show:
  - Pickup status changed to "Approved"
  - Total collections increased
  - Total earnings updated
  - Admin note displayed
  - All updates happen without refresh

## **🔍 Troubleshooting**

### **Common Issues**

#### **1. Real-time updates not working**
```typescript
// Check if subscription is active
console.log('Subscription status:', subscription.subscribe())

// Verify user ID filter
console.log('User ID:', user?.id)
console.log('Filter:', `customer_id=eq.${user?.id}`)
```

#### **2. Database connection issues**
```typescript
// Test connection
const { data, error } = await supabase
  .from('pickups')
  .select('count')
  .limit(1)

console.log('Connection test:', { data, error })
```

#### **3. Permission issues**
- Ensure RLS policies allow customers to read their own pickups
- Check if user is properly authenticated
- Verify user role is 'customer'

### **Debug Commands**
```typescript
// Add this to your component for debugging
useEffect(() => {
  console.log('🔍 Current pickups:', pickups)
  console.log('🔍 User:', user)
}, [pickups, user])
```

## **🚀 Performance Optimization**

### **1. Efficient Queries**
```typescript
// Only fetch necessary fields
const { data } = await supabase
  .from('pickups')
  .select('id, status, total_kg, total_value, created_at, approval_note')
  .eq('customer_id', userId)
```

### **2. Debounced Updates**
```typescript
import { debounce } from 'lodash'

const debouncedUpdate = debounce((payload) => {
  handlePickupUpdate(payload)
}, 100)

// Use in subscription
callback: debouncedUpdate
```

### **3. Optimistic Updates**
```typescript
// Update UI immediately, then sync with server
const handlePickupUpdate = (payload) => {
  if (payload.eventType === 'UPDATE') {
    setPickups(prev => prev.map(pickup => 
      pickup.id === payload.new.id ? payload.new : pickup
    ))
  }
}
```

## **📱 Mobile Responsiveness**

The customer dashboard component includes responsive design:
- **Mobile**: Single column layout
- **Tablet**: 2-column grid for stats
- **Desktop**: Full 4-column grid

## **🎨 Customization**

### **Theme Colors**
```typescript
// Customize status badge colors
const getStatusBadge = (status: string) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
  switch (status) {
    case 'approved':
      return `${baseClasses} bg-green-100 text-green-800` // Customize green
    case 'rejected':
      return `${baseClasses} bg-red-100 text-red-800`     // Customize red
    // Add more statuses as needed
  }
}
```

### **Additional Features**
- **Export to PDF**: Add download functionality for collection history
- **Email notifications**: Send email when pickup is approved
- **Push notifications**: Mobile push for real-time updates
- **Analytics charts**: Visual representation of recycling progress

## **✅ Summary**

With this implementation:

1. **Real-time updates work automatically** - No manual refresh needed
2. **Cross-app synchronization** - Admin and customer dashboards stay in sync
3. **Efficient data flow** - Only necessary data is transferred
4. **Scalable architecture** - Works with multiple customer dashboards
5. **Professional user experience** - Instant feedback and updates

The customer dashboard will now automatically show approved pickups, updated earnings, and all status changes in real-time, creating a seamless experience across your unified recycling system! 🎉
