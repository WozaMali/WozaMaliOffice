# 🗑️ **Clear Pickup Data Guide**

## 📋 **Why Clear the Data?**

The current pickup data in your database is **test/mock data** that was created for development purposes. To test with **real, live pickups**, you need to clear this data so:

- ✅ You can see fresh pickups appear in real-time
- ✅ Test the complete approval workflow from scratch
- ✅ Verify that data flows correctly from collector app to admin dashboard
- ✅ Ensure no confusion between test and real data

## 🚀 **Quick Start - Choose Your Option**

### **Option 1: Clear Everything (Recommended for Fresh Start)**
```sql
-- Run this in Supabase SQL Editor
-- This clears ALL pickup data, addresses, and related records
-- Keeps only user profiles
```

**File:** `clear-test-pickup-data.sql`

### **Option 2: Clear Only Pickups (Keep Users & Addresses)**
```sql
-- Run this in Supabase SQL Editor
-- This clears ONLY pickup-related data
-- Keeps user profiles and addresses for easier testing
```

**File:** `clear-pickups-only.sql`

## 🔧 **How to Clear the Data**

### **Step 1: Go to Supabase Dashboard**
1. Navigate to: `https://supabase.com/dashboard`
2. Select your Woza Mali project
3. Click on **"SQL Editor"** in the left sidebar

### **Step 2: Run the Clear Script**
1. Copy the contents of either clear script
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

### **Step 3: Verify Cleanup**
The script will show you:
- Current data counts before deletion
- Deletion status for each table
- Final data counts after cleanup
- Remaining users and addresses

## 📊 **What Gets Cleared**

### **Tables Cleared:**
- `pickup_photos` - Photos taken during pickups
- `pickup_items` - Individual materials collected
- `payments` - Payment records
- `pickups` - Main pickup records
- `addresses` - Customer addresses (Option 1 only)

### **Tables Preserved:**
- `profiles` - User accounts (admin, collectors, customers)
- `materials` - Material types and rates
- `addresses` - Customer addresses (Option 2 only)

## 🧪 **After Clearing - Test Live Pickups**

### **1. Test Collector App**
- Go to your collector app
- Create a new pickup
- Add materials and photos
- Submit the pickup

### **2. Check Admin Dashboard**
- Go to `/admin` (after admin login)
- You should see the new pickup appear in real-time
- No more mock data cluttering the view

### **3. Test Approval Workflow**
- Approve or reject the pickup
- Verify status changes
- Check that metrics update correctly

## ⚠️ **Important Notes**

### **Before Running:**
- ✅ Make sure you have admin access to Supabase
- ✅ Backup any important data if needed
- ✅ Ensure your app is not actively being used

### **After Running:**
- ✅ The admin dashboard will show 0 pickups initially
- ✅ All pickup-related metrics will reset to 0
- ✅ New pickups will start fresh from 1

### **If Something Goes Wrong:**
- Check the SQL Editor for error messages
- Verify you have the right permissions
- Contact support if you need help

## 🔄 **Quick Commands**

### **Check Current Data:**
```sql
SELECT COUNT(*) as pickup_count FROM public.pickups;
SELECT COUNT(*) as address_count FROM public.addresses;
SELECT COUNT(*) as user_count FROM public.profiles;
```

### **Verify Cleanup:**
```sql
-- Should return 0 after cleanup
SELECT COUNT(*) FROM public.pickups;
SELECT COUNT(*) FROM public.pickup_items;
SELECT COUNT(*) FROM public.pickup_photos;
SELECT COUNT(*) FROM public.payments;
```

## 🎯 **Expected Results**

After running the clear script:

- ✅ **Pickups table**: 0 records
- ✅ **Pickup items table**: 0 records  
- ✅ **Pickup photos table**: 0 records
- ✅ **Payments table**: 0 records
- ✅ **Admin dashboard**: Shows 0 pickups, 0 kg, 0 revenue
- ✅ **Ready for fresh testing**: New pickups will appear cleanly

---

**Ready to clear the data?** Choose your script and run it in Supabase SQL Editor!
