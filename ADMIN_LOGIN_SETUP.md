# 🚀 **Woza Mali Admin Login Setup Guide**

## 📋 **Current Status**
✅ **Fixed Issues:**
- Removed duplicate Supabase client configurations
- Consolidated authentication logic in `use-auth.tsx`
- Removed DEV MODE bypass from admin dashboard
- Added proper role-based access control
- Improved error handling and user feedback

❌ **Still Need to Set Up:**
- Admin user in Supabase Auth
- Admin profile in database
- Link auth user with database profile

## 🔐 **Step 1: Create Admin User in Supabase Auth**

1. **Go to your Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard`
   - Select your Woza Mali project

2. **Navigate to Authentication > Users**
   - Click on "Authentication" in the left sidebar
   - Click on "Users"

3. **Click "Add User"**
   - Fill in the following details:
     - **Email**: `admin@wozamali.com`
     - **Password**: `admin123`
     - **Email confirmed**: ✅ (Check this box)
   - Click "Create User"

4. **Copy the User ID**
   - After creating the user, you'll see a User ID (UUID)
   - Copy this ID - you'll need it for the next step

## 🗄️ **Step 2: Create Admin Profile in Database**

1. **Go to SQL Editor**
   - In your Supabase dashboard, click "SQL Editor" in the left sidebar

2. **Run the Profile Creation Script**
   - Copy and paste the contents of `create-admin-user.sql`
   - **IMPORTANT**: After running the first part, you'll get a profile with a random UUID
   - Now update the profile with the actual User ID from step 1:

```sql
-- Update the profile with the correct User ID from Supabase Auth
UPDATE public.profiles 
SET id = 'YOUR_AUTH_USER_ID_HERE'
WHERE email = 'admin@wozamali.com';
```

3. **Verify the Profile was Created**
   - Run this query to confirm:
```sql
SELECT * FROM profiles WHERE email = 'admin@wozamali.com';
```
   - You should see a profile with `role = 'admin'` and `is_active = true`

## 🧪 **Step 3: Test the Authentication**

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Visit the Admin Login Page**
   - Go to: `http://localhost:3000/admin-login`
   - You should see the login form (no more infinite loading)

3. **Try Logging In**
   - Use the demo credentials: `admin@wozamali.com` / `admin123`
   - Check the browser console for authentication logs
   - You should be redirected to the admin dashboard

4. **Access Admin Dashboard**
   - After successful login, you should see the admin dashboard
   - The sidebar should show your admin name
   - No more "DEV MODE" badges

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Invalid login credentials"**
   - Check that the user exists in Supabase Auth
   - Verify the password is correct
   - Ensure email is confirmed

2. **"Access denied. This account does not have administrator privileges"**
   - Check that the profile has `role = 'admin'`
   - Verify the profile `is_active = true`
   - Ensure the profile ID matches the auth user ID

3. **"Profile not found"**
   - Run the profile creation script again
   - Check that the profile ID matches the auth user ID
   - Verify the profiles table exists and has the correct structure

4. **"Authentication failed"**
   - Check browser console for detailed error messages
   - Verify environment variables are set correctly
   - Restart the development server after changing environment variables

### **Debug Steps:**

1. **Check Browser Console**
   - Look for authentication errors
   - Check network requests to Supabase
   - Look for the emoji-prefixed log messages

2. **Verify Database**
   - Run: `SELECT * FROM profiles WHERE email = 'admin@wozamali.com';`
   - Should return a profile with `role = 'admin'`

3. **Check Environment Variables**
   - Verify `.env` file has correct Supabase credentials
   - Restart the app after changing environment variables

4. **Test Connection**
   - Visit: `http://localhost:3000/test-connection`
   - Run the connection test to verify Supabase connectivity

## 🎯 **Expected Results**

After successful setup, you should be able to:

- ✅ **Login** at `/admin-login` with admin credentials
- ✅ **Access** the protected admin dashboard at `/admin`
- ✅ **See** your admin name in the sidebar
- ✅ **View** real-time pickup data from collectors
- ✅ **Logout** and return to login page
- ✅ **No more** "DEV MODE" or authentication bypasses

## 🚀 **Next Steps**

Once admin authentication is working:

1. **Test the Collector App**
   - Ensure collectors can submit pickups
   - Verify data appears in admin dashboard

2. **Test Approval Workflow**
   - Submit a test pickup from collector app
   - Approve/reject it from admin dashboard

3. **Monitor System Health**
   - Check that all metrics are displaying correctly
   - Verify real-time data updates

## 📁 **Files Modified**

- `src/hooks/use-auth.tsx` - Consolidated Supabase client and improved auth flow
- `app/admin-login/page.tsx` - Removed timeout fallback, added role checks
- `app/admin/AdminDashboardClient.tsx` - Removed DEV MODE, added proper auth
- `create-admin-user.sql` - New script for creating admin user
- `ADMIN_LOGIN_SETUP.md` - This setup guide

---

**Need Help?** Check the browser console for detailed error messages and refer to the troubleshooting section above.
