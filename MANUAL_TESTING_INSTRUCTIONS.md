# Manual Testing Instructions for PET Contribution Fix

## Overview
This document provides step-by-step instructions to manually test the PET contribution fix for the Green Scholar Fund.

## Prerequisites
1. Office app should be running (usually on http://localhost:3000)
2. You should have admin access to the office app
3. There should be collections with PET bottle materials available for testing

## Testing Steps

### Step 1: Check Current Green Scholar Fund Status
1. Open the office app in your browser
2. Navigate to the **Green Scholar Fund** page
3. Note the current **Total PET revenue** amount
4. Take a screenshot or note the current values for comparison

### Step 2: Find a Collection with PET Materials
1. Navigate to the **Collections** page in the office app
2. Look for collections that contain PET bottle materials
3. Note the collection ID and the PET materials included
4. Check if the collection status is "pending" or "submitted"

### Step 3: Approve the Collection
1. Click on the collection to view details
2. Verify that it contains PET bottle materials
3. Click the **Approve** button
4. Add any necessary notes
5. Confirm the approval

### Step 4: Verify PET Contribution Processing
1. Wait a few seconds for the processing to complete
2. Navigate back to the **Green Scholar Fund** page
3. Check if the **Total PET revenue** has increased
4. The increase should be: `PET_weight_kg × R1.50`

### Step 5: Check Transaction History
1. In the Green Scholar Fund page, go to the **Disbursements** tab
2. Look for new transactions with type "pet_contribution"
3. Verify the amount matches the expected calculation
4. Check that the description includes the collection ID

### Step 6: Test Multiple Collections
1. Repeat steps 2-5 with additional collections containing PET materials
2. Verify that each approval processes the PET contribution correctly
3. Check that the total PET revenue accumulates properly

## Expected Results

### ✅ Success Indicators
- PET revenue increases by R1.50 per kg of PET materials
- New transactions appear in the Green Scholar Fund
- No errors in the browser console
- Collection status changes to "approved"

### ❌ Failure Indicators
- PET revenue doesn't increase after approval
- No new transactions in the Green Scholar Fund
- Console errors related to PET contribution processing
- Collection approval fails

## Troubleshooting

### If PET Contributions Don't Appear
1. Check the browser console for errors
2. Verify the collection actually contains PET materials
3. Check if the collection was already processed (idempotent behavior)
4. Look for network errors in the browser dev tools

### If Collection Approval Fails
1. Check that you have admin permissions
2. Verify the collection is in "pending" status
3. Check for validation errors
4. Look at the server logs for detailed error messages

### If API Errors Occur
1. Check that the office app is running
2. Verify the API endpoint is accessible
3. Check the server logs for detailed error information
4. Ensure the database connection is working

## Database Verification (Optional)

If you have database access, you can verify the fix by checking:

```sql
-- Check for new PET contributions
SELECT * FROM green_scholar_transactions 
WHERE transaction_type = 'pet_contribution' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check the total PET revenue
SELECT SUM(amount) as total_pet_revenue 
FROM green_scholar_transactions 
WHERE transaction_type = 'pet_contribution';
```

## Test Data Requirements

For effective testing, you need:
- At least one collection with PET bottle materials
- The collection should be in "pending" or "submitted" status
- The collection should have a valid weight for PET materials
- You should have admin access to approve collections

## Reporting Issues

If you encounter any issues during testing:
1. Note the exact steps that led to the problem
2. Capture any error messages or console output
3. Note the collection ID and materials involved
4. Check the server logs for additional context
5. Report the issue with all relevant details

## Success Criteria

The fix is working correctly if:
- ✅ All PET bottle collections contribute to the Green Scholar Fund
- ✅ The contribution amount is calculated correctly (R1.50 per kg)
- ✅ The process is idempotent (safe to run multiple times)
- ✅ No errors occur during the approval process
- ✅ The Green Scholar Fund page updates in real-time
