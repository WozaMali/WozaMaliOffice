import { supabase, supabaseAdmin } from './supabase';
import { 
  Profile, 
  Pickup, 
  Payment, 
  Material
} from './supabase';

// Custom interface for transformed pickup data with nested properties
export interface TransformedPickup extends Pickup {
  customer?: {
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  collector?: {
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  address?: {
    line1: string;
    suburb: string;
    city: string;
    postal_code: string;
  } | null;
  // Calculated totals from pickup_items
  total_kg: number;
  total_value: number;
}

// Real-time subscription types
export type RealtimeCallback<T> = (payload: { new: T; old: T; eventType: string }) => void;

// Recent Activity interface
export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

// ============================================================================
// TEST CONNECTION
// ============================================================================

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Connection test successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return { success: false, error };
  }
}

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

export async function getUsers(): Promise<Profile[]> {
  console.log('🔍 Fetching users from unified users table...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        full_name,
        phone,
        role_id,
        status,
        created_at,
        updated_at,
        roles!role_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
    
    console.log('✅ Users fetched successfully:', data?.length || 0, 'users found');
    if (data && data.length > 0) {
      console.log('📋 Sample user data:', data[0]);
    }
    
    // Transform unified users data to Profile format for compatibility
    const profiles = data?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
      phone: user.phone,
      role: (user.roles as any)?.name || user.role_id || 'member',
      is_active: user.status === 'active',
      created_at: user.created_at,
      updated_at: user.updated_at
    })) || [];
    
    return profiles;
  } catch (error) {
    console.error('❌ Exception in getUsers:', error);
    throw error;
  }
}

export function subscribeToUsers(callback: RealtimeCallback<Profile>) {
  return supabase
    .channel('users_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
      callback({ new: payload.new as Profile, old: payload.old as Profile, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updateUserRole(userId: string, role: string, isActive: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ role, is_active: isActive })
    .eq('id', userId);

  if (error) throw error;
}

export async function deleteUser(userId: string) {
  console.log(`🗑️ Deleting user ${userId}...`);
  
  try {
    // First, get the user to check if they have any collections
    const { data: userCollections, error: collectionsError } = await supabase
      .from('unified_collections')
      .select('id')
      .or(`customer_id.eq.${userId},collector_id.eq.${userId}`)
      .limit(1);

    if (collectionsError) {
      console.error('❌ Error checking user collections:', collectionsError);
      throw collectionsError;
    }

    if (userCollections && userCollections.length > 0) {
      throw new Error('Cannot delete user with existing collections. Please reassign or delete collections first.');
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Error deleting user profile:', profileError);
      throw profileError;
    }

    console.log('✅ User deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception in deleteUser:', error);
    throw error;
  }
}

export async function getUserDetails(userId: string) {
  console.log(`🔍 Fetching user details for ${userId}...`);
  
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      throw profileError;
    }

    // Get user's collections
    const { data: collections, error: collectionsError } = await supabase
      .from('unified_collections')
      .select('id, collection_code, status, total_weight_kg, total_value, created_at')
      .or(`customer_id.eq.${userId},collector_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (collectionsError) {
      console.error('❌ Error fetching user collections:', collectionsError);
      // Don't throw, just continue without collections
    }

    // Get user's wallet data with fallback to legacy wallets
    let wallet: any = null;
    let walletResp = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (walletResp.error && (walletResp.error.code === 'PGRST205' || walletResp.error.message?.includes("Could not find the table 'public.user_wallets'"))) {
      console.warn('⚠️ user_wallets not found, falling back to wallets');
      walletResp = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    }
    if (walletResp.error) {
      console.error('❌ Error fetching user wallet:', walletResp.error);
      // Don't throw, just continue without wallet
    } else {
      wallet = walletResp.data;
    }

    console.log('✅ User details fetched successfully');
    return {
      profile,
      collections: collections || [],
      wallet: wallet || null
    };
  } catch (error) {
    console.error('❌ Exception in getUserDetails:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, updateData: {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}) {
  console.log(`✏️ Updating user profile for ${userId}...`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }

    console.log('✅ User profile updated successfully');
    return data;
  } catch (error) {
    console.error('❌ Exception in updateUserProfile:', error);
    throw error;
  }
}

export async function createUser(userData: {
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
}) {
  console.log(`➕ Creating new user: ${userData.email}...`);
  
  try {
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: 'TempPassword123!', // Temporary password that user will need to change
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
        phone: userData.phone || '',
        role: userData.role
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user in authentication system');
    }

    // Then create the profile record
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role,
        is_active: userData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError);
      // Try to clean up the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Create a wallet for the user
    try {
      await supabase
        .from('user_wallets')
        .insert({
          user_id: authData.user.id,
          current_points: 0,
          total_points_earned: 0,
          total_points_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (walletError) {
      console.warn('⚠️ Warning: Could not create wallet for user:', walletError);
      // Don't fail the user creation if wallet creation fails
    }

    console.log('✅ User created successfully:', profileData);
    return profileData;
  } catch (error) {
    console.error('❌ Exception in createUser:', error);
    throw error;
  }
}

// ============================================================================
// PICKUPS MANAGEMENT (SIMPLIFIED)
// ============================================================================

// Simple cache to prevent duplicate calls within 1 second (reduced for debugging)
let pickupsCache: { data: TransformedPickup[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 1000; // 1 second (reduced for debugging)

// Function to clear the cache manually
export function clearPickupsCache() {
  pickupsCache = { data: null, timestamp: 0 };
  console.log('🗑️ Pickups cache cleared');
}

export async function getPickups(): Promise<TransformedPickup[]> {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (pickupsCache.data && (now - pickupsCache.timestamp) < CACHE_DURATION) {
    console.log('📋 Using cached pickups data');
    return pickupsCache.data;
  }
  
  console.log('🔍 Fetching pickups from unified_collections...');
  
  try {
    // Unified-only source
    const { data, error } = await supabase
      .from('unified_collections')
      .select('id, customer_id, pickup_address_id, total_weight_kg, computed_value, total_value, status, created_at, updated_at, customer_name, customer_email, collector_name, pickup_address')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('❌ Error fetching unified_collections:', error);
      pickupsCache = { data: [], timestamp: Date.now() };
      return [];
    }

    const rows = (data || []) as any[];
    if (rows.length === 0) {
      console.log('📭 No pickup data found');
      pickupsCache = { data: [], timestamp: Date.now() };
      return [];
    }

    // Transform unified rows to TransformedPickup
    const transformedPickups: TransformedPickup[] = rows.map((c: any) => {
      const totalKg = Number(c.total_weight_kg || 0);
      // Prefer computed_value when present; fallback to total_value
      const totalValue = Number((c.computed_value ?? c.total_value) || 0);

      return {
        // Base
        ...c,
        id: c.id,
        user_id: c.customer_id,
        address_id: c.pickup_address_id || null,
        total_kg: totalKg,
        total_value: totalValue,
        status: c.status || 'pending',
        created_at: c.created_at,
        updated_at: c.updated_at,
        // Nested display fields
        customer: {
          full_name: c.customer_name || 'Unknown Customer',
          email: c.customer_email || '',
          phone: c.customer_phone || ''
        },
        collector: {
          full_name: c.collector_name || 'Unassigned',
          email: c.collector_email || '',
          phone: c.collector_phone || ''
        },
        address: {
          line1: c.pickup_address || 'No address',
          suburb: c.suburb || '',
          city: c.city || '',
          postal_code: c.postal_code || ''
        },
        pickup_items: []
      } as TransformedPickup;
    });

    console.log('✅ Pickups transformed (unified) successfully:', transformedPickups.length);
    // Cache the result
    pickupsCache = { data: transformedPickups, timestamp: Date.now() };
    return transformedPickups;
  } catch (error) {
    console.error('❌ Exception in getPickups:', error);
    // Return empty array instead of throwing to prevent page crash
    pickupsCache = { data: [], timestamp: Date.now() };
    return [];
  }
}

export function subscribeToPickups(callback: RealtimeCallback<any>) {
  // Single channel listening to all potential sources
  return supabase
    .channel('pickups_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, (payload) => {
      pickupsCache = { data: null, timestamp: 0 };
      callback({ new: payload.new as any, old: payload.old as any, eventType: payload.eventType });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections' }, (payload) => {
      pickupsCache = { data: null, timestamp: 0 };
      callback({ new: payload.new as any, old: payload.old as any, eventType: payload.eventType });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, (payload) => {
      pickupsCache = { data: null, timestamp: 0 };
      callback({ new: payload.new as any, old: payload.old as any, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updatePickupStatus(pickupId: string, status: string, approvalNote?: string) {
  console.log(`🔄 Updating collection ${pickupId} status to: ${status}`);

  try {
    // Prefer unified_collections; fallback to collections
    let isUnified = true;
    let existsResp = await supabase
      .from('unified_collections')
      .select('id')
      .eq('id', pickupId)
      .maybeSingle();

    if (existsResp.error || !existsResp.data) {
      isUnified = false;
      existsResp = await supabase
        .from('collections')
        .select('id')
      .eq('id', pickupId)
        .maybeSingle();
      if (existsResp.error || !existsResp.data) {
        console.error('❌ Collection not found in unified_collections or collections');
        throw existsResp.error || new Error('Collection not found');
      }
    }

    // For approved/rejected, use RPC to ensure wallet/points are posted atomically
    if (status === 'approved' || status === 'rejected') {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user?.id) throw authErr || new Error('Not authenticated');

      if (status === 'approved') {
        const { error: rpcErr } = await supabase.rpc('approve_collection', {
          p_collection_id: pickupId,
          p_approver_id: authData.user.id,
          p_note: approvalNote ?? null,
          p_idempotency_key: null
        });
        if (rpcErr) throw rpcErr;

        // Best-effort: automatically process PET Bottles contribution for this approved collection
        try {
          await fetch('/api/green-scholar/pet-bottles-contribution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collectionId: pickupId })
          });
        } catch (e) {
          console.warn('⚠️ PET processing skipped:', e);
        }
      } else {
        const { error: rpcErr } = await supabase.rpc('reject_collection', {
          p_collection_id: pickupId,
          p_approver_id: authData.user.id,
          p_note: approvalNote ?? null
        });
        if (rpcErr) throw rpcErr;
      }

      // Return updated row
      const postResp = isUnified
        ? await supabase.from('unified_collections').select('*').eq('id', pickupId).maybeSingle()
        : await supabase.from('collections').select('*').eq('id', pickupId).maybeSingle();
      if (postResp.error) throw postResp.error;
      console.log('✅ Collection status updated via RPC:', postResp.data?.status);
      return postResp.data;
    }

    // For other statuses, direct update on the appropriate table
    const updateResp = isUnified
      ? await supabase
          .from('unified_collections')
          .update({ status, admin_notes: approvalNote, updated_at: new Date().toISOString() })
          .eq('id', pickupId)
          .select()
          .maybeSingle()
      : await supabase
          .from('collections')
          .update({ status, admin_notes: approvalNote, updated_at: new Date().toISOString() })
          .eq('id', pickupId)
          .select()
          .maybeSingle();

    if (updateResp.error) throw updateResp.error;
    console.log('✅ Collection status updated:', updateResp.data?.status);
    return updateResp.data;
  } catch (error) {
    console.error('❌ Exception in updatePickupStatus:', error);
    throw error;
  }
}

// Helper function to update customer wallet after approval using unified system
async function updateCustomerWallet(customerId: string, totalValue: number, totalWeight: number) {
  console.log(`💰 Updating unified wallet for customer ${customerId} with value: ${totalValue}`);
  
  try {
    // Calculate points (1 point = 1kg, as requested)
    const totalPoints = Math.floor(totalWeight); // 1 point per kg

    // Use the simple wallet update function
    const { data, error } = await supabase.rpc('update_wallet_simple', {
      p_user_id: customerId,
      p_amount: totalValue,
      p_transaction_type: 'collection_approval',
      p_weight_kg: totalWeight,
      p_description: `Collection approved - ${totalWeight}kg recycled`,
      p_reference_id: null // Will be set by the calling function
    });

    if (error) {
      console.error('❌ Error updating unified wallet:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`✅ Unified wallet updated successfully: +${totalPoints} points, +R${totalValue} cash`);
    return data;
  } catch (error) {
    console.error('❌ Exception in updateCustomerWallet:', error);
    // Don't throw here, collection approval should still succeed
    return false;
  }
}

// ============================================================================
// PAYMENTS & WITHDRAWALS
// ============================================================================

export async function getPayments(): Promise<Payment[]> {
  console.log('🔍 Fetching payments from Supabase...');
  
  try {
    // Fetch payments; if payments table missing, return empty to avoid crashing dashboard
    const paymentsResp = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsResp.error) {
      const err = paymentsResp.error as any;
      if (err.code === 'PGRST205' || err.message?.includes("Could not find the table 'public.payments'")) {
        console.debug('payments not found; returning empty payments list');
        return [];
      }
      console.error('❌ Error fetching payments:', err);
      return [];
    }

    const paymentsData = paymentsResp.data || [];

    // Fetch pickup details separately (note: pickups don't have total_kg/total_value columns)
    const pickupIds = Array.from(new Set(paymentsData?.map(p => p.pickup_id).filter(Boolean) || []));
    // Try to fetch pickups for mapping; tolerate missing pickups table
    let pickups: any[] = [];
    if (pickupIds.length > 0) {
      const pickupsResp = await supabase
      .from('pickups')
      .select('id, user_id')
        .in('id', pickupIds);
      if (pickupsResp.error) {
        const pErr = pickupsResp.error as any;
        if (pErr.code === 'PGRST205' || pErr.message?.includes("Could not find the table 'public.pickups'")) {
          console.debug('pickups not found while resolving payments; skipping pickup join');
          pickups = [];
        } else {
          console.error('❌ Error fetching pickups for payments:', pErr);
          pickups = [];
        }
      } else {
        pickups = pickupsResp.data || [];
      }
    }

    // Fetch customer profiles for the pickups (using user_id instead of customer_id)
    const customerIds = Array.from(new Set(pickups?.map(p => p.user_id).filter(Boolean) || []));
    const { data: customerProfiles } = customerIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', customerIds) : { data: [] };

    // Transform the data
    const transformedPayments = (paymentsData || []).map(payment => {
      const pickup = pickups?.find(p => p.id === payment.pickup_id);
      const customer = customerProfiles?.find(p => p.id === pickup?.user_id);

      return {
        ...payment,
        pickup: pickup ? {
          customer: customer ? {
            full_name: customer.full_name || 'Unknown',
            email: customer.email,
            phone: customer.phone
          } : null,
          // Note: total_kg and total_value are calculated from pickup_items, not stored in pickups table
          total_kg: 0, // This would need to be calculated separately if needed
          total_value: 0 // This would need to be calculated separately if needed
        } : null
      };
    });

    console.log('✅ Payments fetched successfully:', transformedPayments.length, 'payments found');
    return transformedPayments;
  } catch (error) {
    console.error('❌ Exception in getPayments:', error);
    throw error;
  }
}

export function subscribeToPayments(callback: RealtimeCallback<Payment>) {
  return supabase
    .channel('payments_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
      callback({ new: payload.new as Payment, old: payload.old as Payment, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updatePaymentStatus(paymentId: string, status: string, adminNotes?: string) {
  const { error } = await supabase
    .from('payments')
    .update({ 
      status, 
      admin_notes: adminNotes,
      processed_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId);

  if (error) throw error;
}

// ============================================================================
// WITHDRAWALS MANAGEMENT (USING withdrawal_requests)
// ============================================================================

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';
  payout_method?: 'wallet' | 'cash' | 'bank_transfer' | 'mobile_money';
  owner_name?: string;
  bank_name?: string;
  account_number?: string;
  account_type?: string;
  branch_code?: string;
  processed_by?: string;
  processed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: { full_name?: string; email?: string } | null;
};

export async function getWithdrawals(status?: string): Promise<Withdrawal[]> {
  try {
    console.log('🔍 getWithdrawals called with status:', status);
    
    // Use API route that has access to service role key
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    
    const response = await fetch(`/api/admin/withdrawals?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 API response:', data);
    
    return data.withdrawals || [];
  } catch (e) {
    console.error('❌ Error fetching withdrawals:', e);
    return [];
  }
}

// Fallback: derive displayable withdrawals from unified_collections when withdrawal_requests is empty or blocked by RLS
export async function getWithdrawalsFallbackFromCollections(params?: { collectionId?: string; customerEmail?: string; limit?: number }): Promise<Withdrawal[]> {
  try {
    const collectionSelect = 'id, customer_id, customer_email, computed_value, total_value, status, created_at, updated_at';
    let q = supabase
      .from('unified_collections')
      .select(collectionSelect)
      .in('status', ['approved','completed'])
      .order('updated_at', { ascending: false });

    if (params?.collectionId) {
      q = q.eq('id', params.collectionId);
    }
    if (params?.customerEmail) {
      q = q.eq('customer_email', params.customerEmail);
    }
    if (params?.limit && params.limit > 0) {
      q = q.limit(params.limit);
    }

    const { data, error } = await q;
    if (error) {
      console.log('getWithdrawalsFallbackFromCollections: unified_collections error (ignored):', error.message);
      return [];
    }
    const rows = (data || []) as any[];
    if (rows.length === 0) return [];

    // Fetch user names by customer_id (user_profiles) and by email (users) for display
    const profileIds = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));
    const emails = Array.from(new Set(rows.map(r => String(r.customer_email || '').toLowerCase()).filter(Boolean)));
    const { data: profiles } = profileIds.length > 0 ? await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', profileIds) : { data: [] } as any;
    const { data: usersByEmail } = emails.length > 0 ? await supabase
      .from('users')
      .select('email, full_name')
      .in('email', emails) : { data: [] } as any;

    const byProfile: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { byProfile[String(p.id)] = p; });
    const byEmail: Record<string, any> = {};
    (usersByEmail || []).forEach((u: any) => { byEmail[String((u.email||'').toLowerCase())] = u; });

    const fallback: Withdrawal[] = rows.map(r => {
      const amount = Number((r.computed_value ?? r.total_value) || 0) || 0;
      const userBlock = byProfile[String(r.customer_id)] || byEmail[String((r.customer_email||'').toLowerCase())] || null;
      return {
        id: r.id,
        user_id: r.customer_id || '',
        amount,
        status: r.status || 'approved',
        created_at: r.created_at,
        updated_at: r.updated_at,
        processed_at: r.updated_at,
        notes: null,
        user: userBlock ? { full_name: userBlock.full_name, email: userBlock.email } : { full_name: undefined, email: r.customer_email }
      } as Withdrawal;
    });

    return fallback;
  } catch (e) {
    console.error('❌ Error in getWithdrawalsFallbackFromCollections:', e);
    return [];
  }
}

export function subscribeToWithdrawals(callback: RealtimeCallback<any>) {
  // Use regular client for real-time subscriptions
  // Note: This may not work if RLS blocks the subscription, but we'll try
  return supabase
    .channel('withdrawal_requests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, (payload) => {
      callback({ new: payload.new as any, old: payload.old as any, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updateWithdrawalStatusOffice(
  withdrawalId: string,
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled',
  adminNotes?: string,
  payoutMethod?: 'wallet' | 'cash' | 'bank_transfer' | 'mobile_money'
): Promise<void> {
  try {
    console.log('🔍 Updating withdrawal status via API:', { withdrawalId, status, adminNotes, payoutMethod });

    const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        adminNotes,
        payoutMethod
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Withdrawal status updated successfully:', result);

    if (result.warning) {
      console.warn('⚠️ Warning:', result.warning);
    }

  } catch (error) {
    console.error('❌ Error updating withdrawal status:', error);
    throw error;
  }
}

// Assign collector to a unified collection (Office action)
export async function assignCollectorToCollection(collectionId: string, collectorId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .update({ collector_id: collectorId, updated_at: new Date().toISOString() })
      .eq('id', collectionId)
      .select('id')
      .single();
    if (error) {
      console.error('❌ Error assigning collector:', error);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error('❌ Exception in assignCollectorToCollection:', e);
    return false;
  }
}

// ============================================================================
// MATERIALS & PRICING
// ============================================================================

export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export function subscribeToMaterials(callback: RealtimeCallback<Material>) {
  return supabase
    .channel('materials_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, (payload) => {
      callback({ new: payload.new as Material, old: payload.old as Material, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updateMaterialPricing(materialId: string, ratePerKg: number) {
  const { error } = await supabase
    .from('materials')
    .update({ rate_per_kg: ratePerKg })
    .eq('id', materialId);

  if (error) throw error;
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

export async function getRecentActivity(limit: number = 20) {
  console.log('🔍 Fetching recent activity...');
  
  try {
    const activities: any[] = [];

    // Get recent collections from unified schema
    console.log('🔍 Fetching recent collections...');
    const { data: recentCollections, error: collectionsError } = await supabase
      .from('unified_collections')
      .select('id, status, created_at, updated_at, customer_id, collection_code, customer_name')
      .order('created_at', { ascending: false })
      .limit(10);

    if (collectionsError) {
      console.error('❌ Error fetching recent collections:', collectionsError);
      console.error('❌ Error details:', {
        message: collectionsError.message,
        details: collectionsError.details,
        hint: collectionsError.hint,
        code: collectionsError.code
      });
      // Don't throw error, just log and continue with empty array
      console.log('⚠️ Continuing with empty collections array due to error');
    } else if (recentCollections) {
      console.log('✅ Recent collections fetched:', recentCollections.length, 'collections found');
      
      // Process collections - customer names are already denormalized in unified_collections
      recentCollections.forEach(collection => {
        const customerName = collection.customer_name || 'Customer';
        const collectionCode = collection.collection_code || collection.id;
        
        if (collection.status === 'pending' || collection.status === 'submitted') {
          activities.push({
            id: collection.id,
            type: 'collection_created',
            title: 'New Collection Submitted',
            description: `${customerName} - Collection ${collectionCode} submitted`,
            timestamp: collection.created_at,
            metadata: { collection_id: collection.id, collection_code: collectionCode, customer_name: customerName }
          });
        } else if (collection.status === 'approved') {
          activities.push({
            id: collection.id,
            type: 'collection_approved',
            title: 'Collection Approved',
            description: `${customerName} - Collection ${collectionCode} approved`,
            timestamp: collection.updated_at || collection.created_at,
            metadata: { collection_id: collection.id, collection_code: collectionCode, customer_name: customerName }
          });
        } else if (collection.status === 'rejected') {
          activities.push({
            id: collection.id,
            type: 'collection_rejected',
            title: 'Collection Rejected',
            description: `${customerName} - Collection ${collectionCode} rejected`,
            timestamp: collection.updated_at || collection.created_at,
            metadata: { collection_id: collection.id, collection_code: collectionCode, customer_name: customerName }
          });
        } else if (collection.status === 'completed') {
          activities.push({
            id: collection.id,
            type: 'collection_completed',
            title: 'Collection Completed',
            description: `${customerName} - Collection ${collectionCode} completed`,
            timestamp: collection.updated_at || collection.created_at,
            metadata: { collection_id: collection.id, collection_code: collectionCode, customer_name: customerName }
          });
        }
      });
    }

    // Get recent user registrations from unified schema
    const { data: recentUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching recent users:', usersError);
      console.error('❌ Users error details:', {
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
        code: usersError.code
      });
    } else if (recentUsers) {
      recentUsers.forEach(user => {
        activities.push({
          id: user.id,
          type: 'user_registered',
          title: 'New User Registered',
          description: `${user.full_name || 'User'} (${user.role})`,
          timestamp: user.created_at,
          metadata: { user_id: user.id, user_name: user.full_name, role: user.role }
        });
      });
    }

    // Sort all activities by timestamp and take the most recent ones
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    console.log('✅ Recent activity fetched successfully:', sortedActivities.length, 'activities found');
    return sortedActivities;
    
  } catch (error) {
    console.error('❌ Exception in getRecentActivity:', error);
    throw error;
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToAllChanges(callbacks: {
  users?: RealtimeCallback<Profile>;
  pickups?: RealtimeCallback<Pickup>;
  payments?: RealtimeCallback<Payment>;
  materials?: RealtimeCallback<Material>;
}) {
  const channels = [];

  if (callbacks.users) {
    channels.push(subscribeToUsers(callbacks.users));
  }
  if (callbacks.pickups) {
    channels.push(subscribeToPickups(callbacks.pickups));
  }
  if (callbacks.payments) {
    channels.push(subscribeToPayments(callbacks.payments));
  }
  if (callbacks.materials) {
    channels.push(subscribeToMaterials(callbacks.materials));
  }

  return channels;
}

// ============================================================================
// WALLET MANAGEMENT
// ============================================================================

let walletTablesMissing = false;

export async function getWalletData() {
  console.log('🔍 Fetching wallet data from Supabase...');
  
  try {
    // Short-circuit if we already detected missing wallet tables
    if (walletTablesMissing) {
      return {
        wallets: [],
        source: 'user_wallets',
        totalWallets: 0,
        totalCashBalance: 0,
        totalCurrentPoints: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        totalLifetimeEarnings: 0,
        totalWeight: 0,
        totalCollections: 0
      };
    }

    // First try unified table `user_wallets`
    let source: 'user_wallets' | 'wallets' = 'user_wallets';
    let walletsResp = await supabase
      .from('user_wallets')
      .select('*')
      .order('current_points', { ascending: false });

    // If missing table (404/PGRST205), fall back to legacy `wallets`
    if (walletsResp.error && (walletsResp.error.code === 'PGRST205' || walletsResp.error.message?.includes("Could not find the table 'public.user_wallets'"))) {
      console.debug('user_wallets not found, falling back to wallets');
      source = 'wallets';
      walletsResp = await supabase
        .from('wallets')
        .select('*')
        .order('balance', { ascending: false });
    }

    if (walletsResp.error) {
      const err = walletsResp.error as any;
      if (err.code === 'PGRST205' || err.message?.includes("Could not find the table 'public.")) {
        console.debug('wallet tables not found; returning zeroed wallet totals');
        walletTablesMissing = true;
      } else {
        console.debug('wallet fetch warning:', err);
      }
      // Return safe empty totals so the dashboard still loads (no console error)
      return {
        wallets: [],
        source,
        totalWallets: 0,
        totalCashBalance: 0,
        totalCurrentPoints: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        totalLifetimeEarnings: 0,
        totalWeight: 0,
        totalCollections: 0
      };
    }

    const wallets = walletsResp.data || [];

    console.log(`✅ Wallet data fetched from ${source}:`, wallets.length, 'wallets found');
    if (wallets.length > 0) console.log('📋 Sample wallet data:', wallets[0]);
    
    // Calculate totals supporting both schemas
    const totalWallets = wallets.length;
    const totalCurrentPoints = wallets.reduce((sum: number, w: any) => sum + (w.current_points ?? w.balance ?? 0), 0);
    const totalPointsEarned = wallets.reduce((sum: number, w: any) => sum + (w.total_points_earned ?? w.total_points ?? 0), 0);
    const totalPointsSpent = wallets.reduce((sum: number, w: any) => sum + (w.total_points_spent ?? 0), 0);

    // Convert points to cash equivalent (1 point = R1)
    const totalCashBalance = totalCurrentPoints;
    const totalLifetimeEarnings = totalPointsEarned;

    return {
      wallets,
      source,
      totalWallets,
      totalCashBalance,
      totalCurrentPoints,
      totalPointsEarned,
      totalPointsSpent,
      totalLifetimeEarnings,
      totalWeight: 0,
      totalCollections: 0
    };
  } catch (error: any) {
    console.error('❌ Exception in getWalletData:', error);
    
    // Check if it's a permission error
    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      console.warn('⚠️ Permission denied for user_wallets table. Admin may need wallet permissions.');
      console.warn('💡 Run FIX_WALLET_PERMISSIONS.sql to grant admin access to wallet data.');
    }
    
    // Return empty data instead of throwing to prevent dashboard crash
    return {
      wallets: [],
      totalWallets: 0,
      totalCashBalance: 0,
      totalCurrentPoints: 0,
      totalPointsEarned: 0,
      totalPointsSpent: 0,
      totalLifetimeEarnings: 0,
      totalWeight: 0,
      totalCollections: 0,
      permissionError: true,
      errorMessage: error?.message || 'Unknown error'
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${kg.toFixed(1)}kg`;
}

// ============================================================================
// ANALYTICS FUNCTIONS (FIXED FOR ACTUAL SCHEMA)
// ============================================================================

export async function getSystemImpact() {
  console.log('🔍 Fetching system impact data (unified schema first)...');

  try {
    // Prefer unified_collections → fallback to collections → legacy pickups
    const revenueStatuses = new Set(['approved', 'completed']);

    // Try unified_collections
    let collectionsResp = await supabase
      .from('unified_collections')
      .select('id, status, customer_id, collector_id, weight_kg, total_weight_kg, computed_value, total_value, created_at, updated_at');

    let source: 'unified_collections' | 'collections' | 'pickups' = 'unified_collections';

    if (collectionsResp.error) {
      console.debug('unified_collections not available, trying collections');
      source = 'collections';
      collectionsResp = await supabase
        .from('collections')
        .select('id, status, user_id, collector_id, weight_kg, total_weight_kg, total_value, created_at, updated_at');
    }

    if (collectionsResp.error) {
      console.debug('collections not available, falling back to legacy pickups');
      source = 'pickups';
      const { data: pickups, error: pickupsError } = await supabase
        .from('pickups')
        .select('id, user_id, status, created_at');
      if (pickupsError) throw pickupsError;

      const totalPickups = pickups?.length || 0;
      const pendingPickups = pickups?.filter(p => (p as any).status === 'pending' || (p as any).status === 'submitted').length || 0;

      // Need items to compute totals for legacy
      const { data: pickupItems } = await supabase
        .from('pickup_items')
        .select('pickup_id, kilograms, rate_per_kg');

      const totalKg = (pickupItems || []).reduce((s, it: any) => s + (Number(it.kilograms) || 0), 0);
      const totalValue = (pickupItems || []).reduce((s, it: any) => s + (Number(it.kilograms) || 0) * (Number(it.rate_per_kg) || 0), 0);
      const uniqueCustomers = new Set((pickups || []).map(p => (p as any).user_id).filter(Boolean)).size;

      const totalCO2Saved = totalKg * 2.5;
      const totalWaterSaved = totalKg * 100;
      const totalLandfillSaved = totalKg;
      const totalTreesEquivalent = totalKg * 0.1;

      return {
        total_pickups: totalPickups,
        pending_pickups: pendingPickups,
        total_kg_collected: totalKg,
        total_value_generated: totalValue,
        unique_customers: uniqueCustomers,
        unique_collectors: 0,
        total_co2_saved: totalCO2Saved,
        total_water_saved: totalWaterSaved,
        total_landfill_saved: totalLandfillSaved,
        total_trees_equivalent: totalTreesEquivalent
      };
    }

    const rows = (collectionsResp.data as any[]) || [];
    const totalPickups = rows.length;
    const pendingPickups = rows.filter(r => r.status === 'pending' || r.status === 'submitted').length;
    const totalKg = rows.reduce((s, r) => s + (Number(r.weight_kg ?? r.total_weight_kg) || 0), 0);
    // Prefer computed_value → total_value → derive from items
    let totalValue = rows.reduce((s, r) => s + (Number(r.computed_value ?? r.total_value) || 0), 0);
    if (!totalValue) {
      const ids = rows.map(r => r.id);
      const { data: items } = await supabase
        .from('collection_materials')
        .select('collection_id, quantity, unit_price')
        .in('collection_id', ids);
      totalValue = (items || []).reduce((s, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
    }
    const uniqueCustomers = new Set(rows.map(r => (source === 'collections' ? r.user_id : r.customer_id)).filter(Boolean)).size;
    const uniqueCollectors = new Set(rows.map(r => r.collector_id).filter(Boolean)).size;

    const totalCO2Saved = totalKg * 2.5;
    const totalWaterSaved = totalKg * 100;
    const totalLandfillSaved = totalKg;
    const totalTreesEquivalent = totalKg * 0.1;

    console.log('✅ System impact data fetched successfully');
    return {
      total_pickups: totalPickups,
      pending_pickups: pendingPickups,
      total_kg_collected: totalKg,
      total_value_generated: totalValue,
      unique_customers: uniqueCustomers,
      unique_collectors: uniqueCollectors,
      total_co2_saved: totalCO2Saved,
      total_water_saved: totalWaterSaved,
      total_landfill_saved: totalLandfillSaved,
      total_trees_equivalent: totalTreesEquivalent
    };
  } catch (error) {
    console.error('❌ Exception in getSystemImpact:', error);
    throw error;
  }
}

export async function getMaterialPerformance() {
  console.log('🔍 Fetching material performance data (unified schema)...');

  try {
    // Fetch collection items and their parent collections' status
    const { data: items, error: itemsError } = await supabase
      .from('collection_materials')
      .select('collection_id, material_id, quantity, unit_price');
    if (itemsError) {
      // Fallback to legacy pickup_items
      console.debug('collection_materials not available, falling back to pickup_items');
      const { data: legacyItems, error: legacyErr } = await supabase
        .from('pickup_items')
        .select('pickup_id, material_id, kilograms, rate_per_kg');
      if (legacyErr) throw legacyErr;
      const { data: pickups, error: pErr } = await supabase
        .from('pickups')
        .select('id, status');
      if (pErr) throw pErr;
      const approvedPickupIds = new Set((pickups || []).filter((p: any) => p.status === 'approved').map((p: any) => p.id));
      const { data: mats } = await supabase.from('materials').select('id, name, category, current_rate, rate_per_kg');
      const idToMat = new Map((mats || []).map((m: any) => [String(m.id), m]));
      const stats: any = {};
      (legacyItems || []).forEach((it: any) => {
        if (!approvedPickupIds.has(it.pickup_id)) return;
        const m = idToMat.get(String(it.material_id)) || {};
        const key = String(m.name || 'Unknown Material');
        if (!stats[key]) {
          stats[key] = {
            material_name: key,
            category: m.category || 'Unknown',
            pickup_count: 0,
            total_kg_collected: 0,
            total_value_generated: 0,
            avg_kg_per_pickup: 0,
            rate_per_kg: Number(m.current_rate ?? m.rate_per_kg ?? it.rate_per_kg ?? 0) || 0
          };
        }
        stats[key].pickup_count += 1;
        stats[key].total_kg_collected += Number(it.kilograms) || 0;
        const rate = Number(it.rate_per_kg ?? stats[key].rate_per_kg) || 0;
        stats[key].total_value_generated += (Number(it.kilograms) || 0) * rate;
        stats[key].avg_kg_per_pickup = stats[key].total_kg_collected / stats[key].pickup_count;
      });
      return Object.values(stats).sort((a: any, b: any) => b.total_kg_collected - a.total_kg_collected);
    }

    const collectionIds = Array.from(new Set((items || []).map((it: any) => it.collection_id).filter(Boolean)));
    let { data: collections, error: collErr } = await supabase
      .from('unified_collections')
      .select('id, status');
    if (collErr) {
      console.debug('unified_collections not available, using collections');
      const resp = await supabase.from('collections').select('id, status');
      collErr = resp.error as any;
      collections = resp.data as any[];
    }
    if (collErr) throw collErr;
    const approvedSet = new Set((collections || []).filter((c: any) => c.status === 'approved' || c.status === 'completed').map((c: any) => c.id));

    const { data: mats } = await supabase.from('materials').select('id, name, category, current_rate, rate_per_kg');
    const idToMat = new Map((mats || []).map((m: any) => [String(m.id), m]));

    const stats: any = {};
    (items || []).forEach((it: any) => {
      if (!approvedSet.has(it.collection_id)) return;
      const m = idToMat.get(String(it.material_id)) || {};
      const key = String(m.name || 'Unknown Material');
      if (!stats[key]) {
        const rate = Number(m.current_rate ?? m.rate_per_kg ?? it.unit_price ?? 0) || 0;
        stats[key] = {
          material_name: key,
          category: m.category || 'Unknown',
          pickup_count: 0,
          total_kg_collected: 0,
          total_value_generated: 0,
          avg_kg_per_pickup: 0,
          rate_per_kg: rate
        };
      }
      stats[key].pickup_count += 1;
      const qty = Number(it.quantity) || 0;
      const unitPrice = Number(it.unit_price ?? stats[key].rate_per_kg) || 0;
      stats[key].total_kg_collected += qty;
      stats[key].total_value_generated += qty * unitPrice;
      stats[key].avg_kg_per_pickup = stats[key].total_kg_collected / stats[key].pickup_count;
    });

    const performanceData = Object.values(stats).sort((a: any, b: any) => b.total_kg_collected - a.total_kg_collected);
    console.log('✅ Material performance data fetched successfully');
    return performanceData;
  } catch (error) {
    console.error('❌ Exception in getMaterialPerformance:', error);
    throw error;
  }
}

// ============================================================================
// COLLECTION DELETION (DEEP WIPE FOR TESTING)
// ============================================================================

export async function deleteCollectionDeep(collectionId: string): Promise<boolean> {
  console.log('🗑️ Deleting collection and related records via server route:', collectionId);
  
  if (!collectionId || typeof collectionId !== 'string') {
    console.error('❌ Invalid collectionId provided:', collectionId);
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.warn('⚠️ Delete request timed out after 15 seconds');
      controller.abort();
    }, 15000); // 15s timeout
    
    console.log('🔄 Making API request to /api/admin/delete-collection...');
    const res = await fetch('/api/admin/delete-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    console.log('📡 API response received:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
    
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      console.error('❌ Delete API failed:', {
        status: res.status,
        statusText: res.statusText,
        response: msg
      });
      return false;
    }
    
    const responseData = await res.json().catch(() => ({}));
    console.log('✅ Delete API succeeded:', responseData);
    return true;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Delete request was aborted (timeout)');
    } else {
      console.error('❌ Exception in deleteCollectionDeep:', error);
    }
    return false;
  }
}

export async function getCollectorPerformance() {
  console.log('🔍 Fetching collector performance data (unified schema)...');

  try {
    // Prefer unified_collections; fallback to collections; legacy has no collectors
    let { data: rows, error } = await supabase
      .from('unified_collections')
      .select('id, collector_id, status, weight_kg, total_weight_kg, computed_value, total_value, created_at, updated_at');
    if (error) {
      console.debug('unified_collections not available, trying collections');
      const resp = await supabase
        .from('collections')
        .select('id, collector_id, status, weight_kg, total_weight_kg, total_value, created_at, updated_at');
      error = resp.error as any;
      rows = resp.data as any[];
    }
    if (error) {
      console.debug('collections not available; returning empty collectors performance');
      return [];
    }

    const revenueStatuses = new Set(['approved', 'completed']);
    const filtered = (rows || []).filter((r: any) => revenueStatuses.has(r.status));
    const collectorIds = Array.from(new Set(filtered.map((r: any) => r.collector_id).filter(Boolean)));
    const { data: users } = collectorIds.length > 0
      ? await supabase.from('users').select('id, full_name, email, phone').in('id', collectorIds)
      : { data: [] as any[] } as any;
    const idToUser = new Map((users || []).map((u: any) => [String(u.id), u]));

    // If value not present, compute from items
    const byId = new Map<string, any[]>();
    filtered.forEach((r: any) => {
      if (!byId.has(r.id)) byId.set(r.id, []);
    });
    const ids = filtered.map((r: any) => r.id);
    const { data: items } = ids.length > 0
      ? await supabase.from('collection_materials').select('collection_id, quantity, unit_price').in('collection_id', ids)
      : { data: [] as any[] } as any;
    const itemsByCollection = new Map<string, any[]>();
    (items || []).forEach((it: any) => {
      if (!itemsByCollection.has(it.collection_id)) itemsByCollection.set(it.collection_id, []);
      itemsByCollection.get(it.collection_id)!.push(it);
    });

    const stats = new Map<string, any>();
    filtered.forEach((r: any) => {
      const cid = String(r.collector_id || '');
      if (!cid) return;
      if (!stats.has(cid)) {
        stats.set(cid, {
          collector_id: cid,
          collector_name: (idToUser.get(cid) as any)?.full_name || 'Unassigned',
          collector_email: (idToUser.get(cid) as any)?.email || '',
          total_pickups: 0,
          total_kg_collected: 0,
          total_value_generated: 0,
          total_co2_saved: 0,
          last_activity: r.updated_at || r.created_at
        });
      }
      const s = stats.get(cid)!;
      s.total_pickups += 1;
      const kg = Number(r.weight_kg ?? r.total_weight_kg) || 0;
      s.total_kg_collected += kg;
      const itemsFor = itemsByCollection.get(r.id) || [];
      const computedFromItems = itemsFor.reduce((sum, it: any) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
      const value = Number(r.computed_value ?? r.total_value) || computedFromItems;
      s.total_value_generated += value;
      s.total_co2_saved += kg * 2.5;
      const last = new Date(s.last_activity).getTime();
      const curr = new Date(r.updated_at || r.created_at).getTime();
      if (curr > last) s.last_activity = r.updated_at || r.created_at;
    });

    return Array.from(stats.values()).sort((a, b) => b.total_value_generated - a.total_value_generated);
  } catch (error) {
    console.error('❌ Exception in getCollectorPerformance:', error);
    throw error;
  }
}

export async function getCustomerPerformance() {
  console.log('🔍 Fetching customer performance data (unified schema)...');

  try {
    // Prefer unified_collections; fallback to collections; legacy last
    const revenueStatuses = new Set(['approved', 'completed']);
    let { data: rows, error } = await supabase
      .from('unified_collections')
      .select('id, customer_id, status, weight_kg, total_weight_kg, computed_value, total_value, created_at');
    if (error) {
      console.debug('unified_collections not available, trying collections');
      const resp = await supabase
        .from('collections')
        .select('id, user_id, status, weight_kg, total_weight_kg, total_value, created_at');
      error = resp.error as any;
      rows = resp.data as any[];
    }

    if (!error && rows && rows.length > 0) {
      const filtered = (rows || []).filter((r: any) => revenueStatuses.has(r.status));
      const ids = filtered.map((r: any) => r.id);
      const custIds = Array.from(new Set(filtered.map((r: any) => (('customer_id' in r) ? r.customer_id : r.user_id)).filter(Boolean)));

      const { data: items } = ids.length > 0
        ? await supabase.from('collection_materials').select('collection_id, quantity, unit_price').in('collection_id', ids)
        : { data: [] as any[] } as any;
      const itemsByCollection = new Map<string, any[]>();
      (items || []).forEach((it: any) => {
        if (!itemsByCollection.has(it.collection_id)) itemsByCollection.set(it.collection_id, []);
        itemsByCollection.get(it.collection_id)!.push(it);
      });

      // Fetch users for names/emails
      const { data: users } = custIds.length > 0
        ? await supabase.from('users').select('id, full_name, email').in('id', custIds)
        : { data: [] as any[] } as any;
      const idToUser = new Map((users || []).map((u: any) => [String(u.id), u]));
      // Fallback to legacy profiles if any unresolved
      const resolved = new Set((users || []).map((u: any) => String(u.id)));
      const unresolved = custIds.filter(id => !resolved.has(String(id)));
      const { data: legacyProfiles } = unresolved.length > 0
        ? await supabase.from('profiles').select('id, full_name, email').in('id', unresolved)
        : { data: [] as any[] } as any;
      const idToLegacy = new Map((legacyProfiles || []).map((p: any) => [String(p.id), p]));

      // Wallets
      const { data: wallets1, error: wErr1 } = custIds.length > 0
        ? await supabase.from('user_wallets').select('user_id, current_points').in('user_id', custIds)
        : { data: [] as any[], error: null } as any;
      let wallets = wallets1 || [];
      if (wErr1 || !wallets1) {
        const { data: w2 } = custIds.length > 0
          ? await supabase.from('wallets').select('user_id, balance').in('user_id', custIds)
          : { data: [] as any[] } as any;
        wallets = (w2 || []).map((w: any) => ({ user_id: w.user_id, current_points: w.balance }));
      }

      const stats: any = {};
      filtered.forEach((r: any) => {
        const customerId = String(('customer_id' in r) ? r.customer_id : r.user_id || '');
        if (!customerId) return;
        if (!stats[customerId]) {
          const u = idToUser.get(customerId) || idToLegacy.get(customerId) || {};
          const wallet = (wallets || []).find((w: any) => String(w.user_id) === customerId);
          stats[customerId] = {
            customer_id: customerId,
            customer_name: (u as any).full_name || 'Unknown Resident',
            customer_email: (u as any).email || '',
            total_pickups: 0,
            total_kg_recycled: 0,
            total_value_earned: 0,
            total_wallet_balance: Number(wallet?.current_points) || 0,
            last_activity: r.created_at
          };
        }
        const s = stats[customerId];
        s.total_pickups += 1;
        const kg = Number(r.weight_kg ?? r.total_weight_kg) || 0;
        s.total_kg_recycled += kg;
        const itemsFor = itemsByCollection.get(r.id) || [];
        const computedFromItems = itemsFor.reduce((sum, it: any) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
        const value = Number(r.computed_value ?? r.total_value) || computedFromItems;
        s.total_value_earned += value;
        s.last_activity = r.created_at;
      });

      return Object.values(stats).sort((a: any, b: any) => b.total_value_earned - a.total_value_earned);
    }

    // Legacy fallback
    console.debug('Falling back to legacy pickups for customer performance');
    const { data: pickups, error: pErr } = await supabase
      .from('pickups')
      .select('id, user_id, status, created_at')
      .eq('status', 'approved');
    if (pErr) throw pErr;
    const { data: pickupItems } = await supabase.from('pickup_items').select('pickup_id, kilograms, rate_per_kg');
    const ids = Array.from(new Set((pickups || []).map((p: any) => p.user_id).filter(Boolean)));
    const { data: profiles } = ids.length > 0 ? await supabase.from('profiles').select('id, full_name, email').in('id', ids) : { data: [] as any[] } as any;
    const idToProfile = new Map((profiles || []).map((p: any) => [String(p.id), p]));

    const stats: any = {};
    (pickups || []).forEach((p: any) => {
      const customerId = String(p.user_id || '');
      if (!customerId) return;
      if (!stats[customerId]) {
        const prof = idToProfile.get(customerId) || {};
        stats[customerId] = {
          customer_id: customerId,
          customer_name: (prof as any).full_name || 'Unknown Resident',
          customer_email: (prof as any).email || '',
          total_pickups: 0,
          total_kg_recycled: 0,
          total_value_earned: 0,
          total_wallet_balance: 0,
          last_activity: p.created_at
        };
      }
      const s = stats[customerId];
      s.total_pickups += 1;
      const itemsFor = (pickupItems || []).filter((it: any) => it.pickup_id === p.id);
      const kg = itemsFor.reduce((sum, it: any) => sum + (Number(it.kilograms) || 0), 0);
      const value = itemsFor.reduce((sum, it: any) => sum + (Number(it.kilograms) || 0) * (Number(it.rate_per_kg) || 0), 0);
      s.total_kg_recycled += kg;
      s.total_value_earned += value;
    });

    return Object.values(stats).sort((a: any, b: any) => b.total_value_earned - a.total_value_earned);
  } catch (error) {
    console.error('❌ Exception in getCustomerPerformance:', error);
    throw error;
  }
}