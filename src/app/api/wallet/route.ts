import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch wallet data
    const { data: wallet, error: walletError } = await supabase
      .from('enhanced_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }

    // If no wallet exists, create one
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('enhanced_wallets')
        .insert({
          user_id: user.id,
          balance: 0.00,
          total_points: 0,
          tier: 'bronze',
          sync_status: 'synced'
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: newWallet });
    }

    return NextResponse.json({ success: true, data: wallet });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { balance_change, points_change, description } = body;

    if (typeof balance_change !== 'number' || typeof points_change !== 'number') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Use the database function to update wallet and queue sync
    const { data, error } = await supabase.rpc('update_wallet_with_sync', {
      p_user_id: user.id,
      p_balance_change: balance_change,
      p_points_change: points_change,
      p_description: description || null
    });

    if (error) {
      console.error('Wallet update error:', error);
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Wallet update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
