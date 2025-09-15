/**
 * Test script to verify collection deletion functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Test the delete collection API
async function testDeleteCollection() {
  console.log('Testing collection deletion functionality...');
  
  // Test data
  const testCollectionId = 'test-collection-id-123';
  
  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:8081/api/admin/delete-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId: testCollectionId })
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ Delete collection API test passed');
    } else {
      console.log('❌ Delete collection API test failed');
      console.log('Error details:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testDeleteCollection().catch(console.error);
