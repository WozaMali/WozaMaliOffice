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

async function applyCorrectedSoftDeleteFix() {
  try {
    console.log('🔧 Applying corrected soft delete RPC fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'FIX_SOFT_DELETE_RPC_CORRECTED.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Manual fix required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of FIX_SOFT_DELETE_RPC_CORRECTED.sql');
    console.log('4. Execute the SQL script');
    console.log('5. Test the soft delete functionality in the office app');
    
    console.log('\n📄 SQL file location:', sqlPath);
    console.log('✅ This will fix the "weight_kg" field error');
    console.log('🎯 The RPC function now matches the actual unified_collections table structure');
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

applyCorrectedSoftDeleteFix();
