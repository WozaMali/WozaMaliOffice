# Admin User Creation Setup Guide

## Problem Solved
The error "Your account does not have the necessary privileges to access this endpoint" occurs because the client-side Supabase library doesn't have admin privileges to create users via `supabase.auth.admin.createUser()`.

## Solution Implemented

### 1. Server-Side API Route
- **File**: `app/api/admin/create-user/route.ts`
- **Purpose**: Handles user creation with proper admin privileges
- **Uses**: Supabase service role key for admin operations

### 2. Updated Add User Modal
- **File**: `app/admin/AddUserModalAPI.tsx`
- **Purpose**: Client-side form that calls the API route
- **Features**: Full validation, error handling, success feedback

### 3. Database Schema
- **File**: `create-user-schema.sql`
- **Purpose**: Creates necessary tables and functions
- **Features**: Role management, user creation functions, views

## Setup Instructions

### Step 1: Environment Variables
Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for admin operations. Get it from:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)

### Step 2: Run Database Schema
Execute `create-user-schema.sql` in Supabase SQL Editor to create:
- Roles table with default roles
- User creation functions
- Database views
- RLS policies

### Step 3: Test the System
1. Go to Team Members page
2. Click "Add New User"
3. Fill out the form
4. User should be created successfully

## Features

### ✅ User Creation
- Creates user in Supabase Auth
- Creates user profile in database
- Auto-generates employee numbers
- Role-based permissions

### ✅ Collector Approval
- View pending collector signups
- One-click approve/reject
- Real-time status updates

### ✅ Security
- Server-side validation
- Proper error handling
- Role-based access control

## Troubleshooting

### If you still get permission errors:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check that the service role key has admin privileges
3. Ensure the database schema is properly installed

### If user creation fails:
1. Check the API route logs
2. Verify database connection
3. Check that all required tables exist

## API Endpoints

### POST `/api/admin/create-user`
Creates a new team member with admin privileges.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "admin",
  "department": "IT",
  "township": "Soweto",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "employee_number": "EMP0001",
    "message": "User created successfully"
  }
}
```

## Database Functions

### `create_team_member()`
Creates a new team member in the database.

### `approve_collector()`
Approves a pending collector signup.

### `reject_collector()`
Rejects a pending collector signup.

## Views

### `v_pending_collectors`
Shows all collectors awaiting approval.

### `v_team_members`
Shows all active team members with role information.

## Security Notes

- Service role key should be kept secure
- Only use in server-side code
- Never expose in client-side code
- Regularly rotate the key

The system now provides complete user management with proper security and admin privileges!
