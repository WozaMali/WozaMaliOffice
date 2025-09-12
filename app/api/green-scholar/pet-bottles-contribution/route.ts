import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables for PET Bottles contribution API');
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    console.log('🔍 Processing PET Bottles contribution for collection:', collectionId);

    // Load collection from unified_collections first, then fallback to legacy collections
    let userId: string | null = null;
    let status: string | null = null;

    // Try unified
    const { data: unified, error: unifiedErr } = await supabaseAdmin
      .from('unified_collections')
      .select('id, customer_id, status')
      .eq('id', collectionId)
      .maybeSingle();

    if (unified && !unifiedErr) {
      userId = unified.customer_id as any;
      status = unified.status as any;
      console.log('✅ Found in unified_collections:', { userId, status });
    } else {
      console.log('❌ Not found in unified_collections:', unifiedErr);
      // Fallback legacy
      const { data: legacy, error: legacyErr } = await supabaseAdmin
        .from('collections')
        .select('id, user_id, status')
        .eq('id', collectionId)
        .maybeSingle();
      if (!legacy || legacyErr) {
        console.error('❌ Collection not found in unified or legacy:', unifiedErr || legacyErr);
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      userId = legacy.user_id as any;
      status = legacy.status as any;
      console.log('✅ Found in legacy collections:', { userId, status });
    }

    console.log('📋 Collection status:', status);
    // Process regardless of status for now
    // if ((status || '').toLowerCase() !== 'approved') {
    //   return NextResponse.json({ message: 'Collection not approved', processed: false });
    // }

    // Compute PET contribution from collection_materials joined to materials
    const { data: petLines, error: petErr } = await supabaseAdmin
      .from('collection_materials')
      .select('quantity, unit_price, materials!inner(name, current_rate)')
      .eq('collection_id', collectionId)
      .ilike('materials.name', 'PET%');

    if (petErr) {
      console.error('❌ Error fetching collection materials:', petErr);
      return NextResponse.json({ error: 'Failed to compute PET contribution' }, { status: 500 });
    }

    const contributionAmount = (petLines || []).reduce((sum: number, row: any) => {
      const qty = Number(row.quantity) || 0;
      const price = Number(row.unit_price ?? row.materials?.current_rate ?? 0) || 0;
      return sum + qty * price;
    }, 0);

    if (!contributionAmount || contributionAmount <= 0) {
      return NextResponse.json({ message: 'No PET materials found for this collection', processed: false });
    }

    console.log('💰 PET Bottles contribution amount:', contributionAmount);

    // Create Green Scholar Fund transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('green_scholar_transactions')
      .insert({
        transaction_type: 'contribution',
        amount: contributionAmount,
        source_type: 'pet_bottles_collection',
        source_id: collectionId,
        description: `PET Bottles collection contribution`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Error creating Green Scholar Fund transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Optionally update per-user totals (best effort)
    if (userId) {
      try {
        await updateUserContributionTotals(userId);
      } catch (e) {
        console.warn('⚠️ Skipping user totals update:', e);
      }
    }

    console.log('✅ PET Bottles contribution processed successfully:', transaction);

    return NextResponse.json({ 
      message: 'PET Bottles contribution processed successfully',
      transaction,
      contributionAmount,
      processed: true
    });

  } catch (error: any) {
    console.error('❌ Error processing PET Bottles contribution:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

async function updateUserContributionTotals(userId: string): Promise<void> {
  try {
    // Get user's PET Bottles contributions
    // Sum PET contributions from collection_materials across all approved collections
    const { data: approvedIds } = await supabaseAdmin
      .from('unified_collections')
      .select('id')
      .eq('customer_id', userId)
      .eq('status', 'approved');

    const ids = (approvedIds || []).map((r: any) => r.id);
    let totalPetAmount = 0;
    if (ids.length > 0) {
      const { data: petRows } = await supabaseAdmin
        .from('collection_materials')
        .select('quantity, unit_price, materials!inner(name, current_rate)')
        .in('collection_id', ids)
        .ilike('materials.name', 'PET%');
      totalPetAmount = (petRows || []).reduce((sum: number, row: any) => {
        const qty = Number(row.quantity) || 0;
        const price = Number(row.unit_price ?? row.materials?.current_rate ?? 0) || 0;
        return sum + qty * price;
      }, 0);
    }

    if (petError) {
      console.error('Error fetching PET collections for user:', petError);
      return;
    }

    // Calculate total PET contribution
    // totalPetAmount computed above

    // Get user's direct donations
    const { data: donations, error: donationError } = await supabaseAdmin
      .from('green_scholar_donations')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (donationError) {
      console.error('Error fetching donations for user:', donationError);
      return;
    }

    const totalDonationAmount = (donations || []).reduce((sum, donation) => {
      return sum + (Number(donation.amount) || 0);
    }, 0);

    const totalContribution = totalPetAmount + totalDonationAmount;

    // Upsert user contribution totals
    const { error: upsertError } = await supabaseAdmin
      .from('green_scholar_user_contributions')
      .upsert({
        user_id: userId,
        total_pet_amount: totalPetAmount,
        total_donation_amount: totalDonationAmount,
        total_contribution: totalContribution,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating user contribution totals:', upsertError);
    } else {
      console.log('User contribution totals updated successfully:', {
        userId,
        totalPetAmount,
        totalDonationAmount,
        totalContribution
      });
    }

  } catch (error) {
    console.error('Error updating user contribution totals:', error);
  }
}
