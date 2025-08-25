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

    // Fetch all active reward definitions
    const { data: rewards, error: rewardsError } = await supabase
      .from('reward_definitions')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    if (rewardsError) {
      console.error('Rewards fetch error:', rewardsError);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rewards });
  } catch (error) {
    console.error('Rewards API error:', error);
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'ADMIN' && profile.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { reward_code, name, description, points_cost, monetary_value, reward_type } = body;

    // Validate required fields
    if (!reward_code || !name || !reward_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new reward definition
    const { data: newReward, error: createError } = await supabase
      .from('reward_definitions')
      .insert({
        reward_code,
        name,
        description: description || '',
        points_cost: points_cost || 0,
        monetary_value: monetary_value || 0.00,
        reward_type,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Reward creation error:', createError);
      return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newReward });
  } catch (error) {
    console.error('Reward creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
