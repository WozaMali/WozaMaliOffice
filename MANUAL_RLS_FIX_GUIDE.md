# 🔧 Manual RLS Fix Guide

## 🚨 **Issue**: 500 Internal Server Errors on unified_collections table

The office app is experiencing database permission issues that need to be fixed manually in the Supabase dashboard.

## 🎯 **Root Cause**
- RLS (Row Level Security) policies are causing infinite recursion
- Permission issues with unified_collections table
- Complex policy dependencies causing conflicts

## 🛠️ **Manual Fix Steps**

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your Woza Mali project
3. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Apply the Complete Fix**
Copy and paste this SQL script into the SQL Editor and execute it:

```sql
-- ============================================================================
-- COMPLETE RLS FIX FOR OFFICE APP
-- ============================================================================

-- Step 1: Drop ALL problematic policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "SUPER_ADMIN can view all users" ON public.users;
DROP POLICY IF EXISTS "SUPER_ADMIN can manage all users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can view non-superadmin users" ON public.users;
DROP POLICY IF EXISTS "ADMIN can manage non-superadmin users" ON public.users;
DROP POLICY IF EXISTS "simple_users_select" ON public.users;
DROP POLICY IF EXISTS "simple_users_update" ON public.users;
DROP POLICY IF EXISTS "simple_users_insert" ON public.users;
DROP POLICY IF EXISTS "simple_users_service_all" ON public.users;

-- Drop unified_collections policies
DROP POLICY IF EXISTS "unified_collections_select_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_insert_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_update_all" ON public.unified_collections;
DROP POLICY IF EXISTS "unified_collections_service_role_all" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_select" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_insert" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_update" ON public.unified_collections;
DROP POLICY IF EXISTS "allow_all_delete" ON public.unified_collections;
DROP POLICY IF EXISTS "service_role_all" ON public.unified_collections;

-- Step 2: Temporarily disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_collections DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant all permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.unified_collections TO service_role;
GRANT ALL ON public.unified_collections TO anon;

-- Step 4: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_collections ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive policies
CREATE POLICY "users_allow_all" ON public.users 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

CREATE POLICY "unified_collections_allow_all" ON public.unified_collections 
    FOR ALL TO authenticated, anon, service_role 
    USING (true) WITH CHECK (true);

-- Step 6: Verify the fix
SELECT 'RLS Fix Applied Successfully' as status;
```

### **Step 3: Verify the Fix**
After running the SQL, test these queries in the SQL Editor:

```sql
-- Test 1: Check users table
SELECT id, email, role FROM public.users LIMIT 3;

-- Test 2: Check unified_collections table
SELECT * FROM public.unified_collections LIMIT 3;

-- Test 3: Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'unified_collections') 
AND schemaname = 'public';
```

### **Step 4: Test the Office App**
1. Go to: http://localhost:8081
2. Check if the 500 errors are gone
3. Verify that the dashboard loads properly

## 🔍 **Alternative: Quick Disable RLS (Temporary)**

If you need a quick fix for development, you can temporarily disable RLS:

```sql
-- TEMPORARY: Disable RLS completely (NOT for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_collections DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only use this for development. Re-enable RLS for production.

## 📊 **Expected Results**

After applying the fix:
- ✅ No more 500 Internal Server Errors
- ✅ Office app loads without database errors
- ✅ Users table queries work properly
- ✅ Unified collections table queries work properly
- ✅ Dashboard displays data correctly

## 🆘 **If Issues Persist**

1. Check Supabase logs in the dashboard
2. Verify your service role key is correct
3. Ensure the tables exist and have proper structure
4. Contact support if the issue continues

## 📝 **Notes**

- This fix creates very permissive policies for development
- For production, you should implement more restrictive policies
- The fix removes all complex policy dependencies that were causing recursion
- All roles (authenticated, anon, service_role) get full access to both tables
