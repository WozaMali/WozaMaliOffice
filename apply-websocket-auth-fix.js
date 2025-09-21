const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWebSocketAuthFix() {
  try {
    console.log('🔧 Applying WebSocket authentication fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'FIX_WEBSOCKET_AUTH.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Manual fix required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of FIX_WEBSOCKET_AUTH.sql');
    console.log('4. Execute the SQL script');
    console.log('5. Refresh the office app to test WebSocket connections');
    
    console.log('\n📄 SQL file location:', sqlPath);
    console.log('✅ This will fix WebSocket authentication issues:');
    console.log('   - Ensures proper RLS policies for users table');
    console.log('   - Grants necessary permissions for realtime');
    console.log('   - Enables realtime for users table');
    console.log('   - Fixes "HTTP Authentication failed" errors');
    
    console.log('\n🔍 The issue is likely caused by:');
    console.log('   - RLS policies blocking realtime access');
    console.log('   - Missing permissions for WebSocket connections');
    console.log('   - Realtime not properly enabled for users table');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

applyWebSocketAuthFix();
