# Member Page Troubleshooting Guide

## Issue: Member names and addresses still not showing

### Step 1: Run the Troubleshooting Script

First, run the comprehensive troubleshooting script to identify the issue:

```sql
\i troubleshoot-member-page.sql
```

This script will:
- Check if all required tables and views exist
- Create fresh sample data
- Verify the data was created correctly
- Test the view functionality

### Step 2: Check Browser Console

Open your browser's developer tools (F12) and check the console for any error messages. Look for:

- 🔍 "Fetching member profiles with user addresses..."
- 📊 "Raw data from view:" - This should show data count and sample
- ✅ "Transformed data:" - This should show member count and sample
- ❌ Any error messages

### Step 3: Verify Database Connection

Run the basic connection test:

```sql
\i test-database-connection.sql
```

This will verify:
- Database connection is working
- Required tables exist
- Required views exist
- Basic data counts

### Step 4: Check Common Issues

#### Issue 1: No Data in Database
**Symptoms**: Console shows "Raw data from view: { count: 0, sample: [] }"
**Solution**: Run the troubleshooting script to create sample data

#### Issue 2: View Doesn't Exist
**Symptoms**: Console shows "❌ Supabase error: relation 'office_member_user_addresses_view' does not exist"
**Solution**: Run the setup script:
```sql
\i setup-user-addresses-schema.sql
```

#### Issue 3: Data Transformation Issues
**Symptoms**: Console shows data from view but "Transformed data: { memberCount: 0, sample: [] }"
**Solution**: Check if the view data structure matches what the transformation expects

#### Issue 4: React Component Issues
**Symptoms**: Console shows data but UI doesn't update
**Solution**: Check if the component is properly using the hook and rendering the data

### Step 5: Manual Data Creation

If the automated scripts don't work, manually create data:

```sql
-- Create a test member
INSERT INTO public.profiles (
    id, email, full_name, first_name, last_name, phone, role, is_active, username, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    'test@example.com', 
    'Test User', 
    'Test', 
    'User', 
    '+27123456789', 
    'member', 
    true, 
    'testuser', 
    NOW(), 
    NOW()
);

-- Create a wallet for the test member
INSERT INTO public.wallets (user_id, balance, total_points, tier, created_at, updated_at)
SELECT 
    id, 
    100.00, 
    500, 
    'Gold Recycler', 
    NOW(), 
    NOW()
FROM public.profiles 
WHERE email = 'test@example.com';

-- Create an address for the test member
INSERT INTO public.user_addresses (
    id, user_id, address_type, address_line1, address_line2, city, province, postal_code, country, is_default, is_active, notes, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    id,
    'primary',
    '123 Test Street',
    'Unit 1',
    'Cape Town',
    'Western Cape',
    '8001',
    'South Africa',
    true,
    true,
    'Test address',
    NOW(),
    NOW()
FROM public.profiles 
WHERE email = 'test@example.com';
```

### Step 6: Test the View Directly

Test if the view returns data:

```sql
SELECT * FROM public.office_member_user_addresses_view LIMIT 5;
```

### Step 7: Check React Component

If the database has data but the UI doesn't show it:

1. **Check the hook**: Verify `useMemberProfiles` is being called correctly
2. **Check the component**: Verify `MemberManagement` is rendering the data
3. **Check the state**: Verify the component state is updating with data

### Step 8: Debug the Service Function

Add more debugging to the service function by checking:

1. **Supabase connection**: Verify the Supabase client is configured correctly
2. **View permissions**: Verify the authenticated user has access to the view
3. **Data format**: Verify the view returns data in the expected format

### Expected Console Output

When working correctly, you should see:

```
🔍 Fetching member profiles with user addresses...
📊 Raw data from view: { count: 15, sample: [...] }
✅ Transformed data: { memberCount: 5, sample: [...] }
🔄 Hook: Fetching member profiles...
📊 Hook: Received data: { count: 5, sample: [...] }
✅ Hook: Data processed successfully
```

### Common Error Messages and Solutions

1. **"relation 'office_member_user_addresses_view' does not exist"**
   - Solution: Run `setup-user-addresses-schema.sql`

2. **"Raw data from view: { count: 0, sample: [] }"**
   - Solution: Run `troubleshoot-member-page.sql` to create data

3. **"Transformed data: { memberCount: 0, sample: [] }"**
   - Solution: Check the view data structure and transformation logic

4. **"Hook: Received data: { count: 0, sample: [] }"**
   - Solution: Check the service function and database connection

### Final Verification

After running the troubleshooting steps, the member page should display:

1. **Statistics Cards** with non-zero values
2. **Member List** with member names and addresses
3. **Address Information** showing address types and details
4. **Wallet Information** showing balances and points

If you're still having issues after following these steps, please share:
1. The console output from the browser
2. The results from running the troubleshooting scripts
3. Any error messages you see
