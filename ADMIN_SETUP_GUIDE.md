# 🚀 **Woza Mali Admin Portal Setup Guide**

## 📋 **Prerequisites**
- ✅ Supabase project is running
- ✅ Environment variables are configured in `.env`
- ✅ Main app is running on port 8081

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
   - Copy and paste the contents of `create-test-admin-user.sql`
   - **IMPORTANT**: Replace `gen_random_uuid()` with the actual User ID you copied
   - Click "Run" to execute the script

3. **Verify the Profile was Created**
   - The script should show the created profile
   - You should see the admin user with role `admin`

## 🧪 **Step 3: Test the Authentication**

1. **Visit the Test Page**
   - Go to: `http://localhost:8081/test-auth`
   - This page will show you the current authentication status

2. **Try Logging In**
   - Click the "Test Login" button
   - Check the browser console for results
   - You should see successful authentication

3. **Access Admin Dashboard**
   - Go to: `http://localhost:8081/admin-login`
   - Login with: `admin@wozamali.com` / `admin123`
   - You should be redirected to the admin dashboard

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Column 'is_verified' does not exist"**
   - ✅ **FIXED**: Updated SQL script to match actual table structure

2. **"Role 'ADMIN' not found"**
   - ✅ **FIXED**: Updated code to use lowercase `'admin'` role

3. **"Authentication failed"**
   - Check that the user exists in Supabase Auth
   - Verify the profile was created in the database
   - Check browser console for detailed error messages

4. **"Access denied"**
   - Ensure the profile has `role = 'admin'`
   - Check that `is_active = true`

### **Debug Steps:**

1. **Check Browser Console**
   - Look for authentication errors
   - Check network requests to Supabase

2. **Verify Database**
   - Run: `SELECT * FROM profiles WHERE email = 'admin@wozamali.com';`
   - Should return a profile with `role = 'admin'`

3. **Check Environment Variables**
   - Verify `.env` file has correct Supabase credentials
   - Restart the app after changing environment variables

## 🎯 **Expected Results**

After successful setup, you should be able to:

- ✅ **Login** at `/admin-login` with admin credentials
- ✅ **Access** the protected admin dashboard at `/admin`
- ✅ **View** real-time pickup data from collectors
- ✅ **Approve/Reject** submitted pickups
- ✅ **See** live statistics and metrics
- ✅ **Logout** and return to login page

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

---

**Need Help?** Check the browser console for detailed error messages and refer to the troubleshooting section above.
