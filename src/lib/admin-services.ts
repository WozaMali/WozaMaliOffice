import { supabase } from './supabase';
import { 
  Profile, 
  Pickup, 
  Payment, 
  Material,
  AdminDashboardView,
  SystemImpactView,
  MaterialPerformanceView,
  CollectorPerformanceView,
  CustomerPerformanceView
} from './supabase';

// Real-time subscription types
export type RealtimeCallback<T> = (payload: { new: T; old: T; eventType: string }) => void;

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
  console.log('🔍 Fetching users from Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
    
    console.log('✅ Users fetched successfully:', data?.length || 0, 'users found');
    if (data && data.length > 0) {
      console.log('📋 Sample user data:', data[0]);
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Exception in getUsers:', error);
    throw error;
  }
}

export function subscribeToUsers(callback: RealtimeCallback<Profile>) {
  return supabase
    .channel('profiles_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
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

// ============================================================================
// PICKUPS MANAGEMENT
// ============================================================================

export async function getPickups(): Promise<Pickup[]> {
  const { data, error } = await supabase
    .from('pickups')
    .select(`
      *,
      customer:profiles!pickups_customer_id_fkey(full_name, email, phone),
      collector:profiles!pickups_collector_id_fkey(full_name, email, phone),
      address:addresses(line1, suburb, city, postal_code)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function subscribeToPickups(callback: RealtimeCallback<Pickup>) {
  return supabase
    .channel('pickups_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, (payload) => {
      callback({ new: payload.new as Pickup, old: payload.old as Pickup, eventType: payload.eventType });
    })
    .subscribe();
}

export async function updatePickupStatus(pickupId: string, status: string, approvalNote?: string) {
  const { error } = await supabase
    .from('pickups')
    .update({ 
      status, 
      approval_note: approvalNote,
      updated_at: new Date().toISOString()
    })
    .eq('id', pickupId);

  if (error) throw error;
}

// ============================================================================
// PAYMENTS & WITHDRAWALS
// ============================================================================

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      pickup:pickups(
        customer:profiles!pickups_customer_id_fkey(full_name, email, phone),
        total_kg,
        total_value
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
// ANALYTICS & DASHBOARD DATA
// ============================================================================

export async function getSystemImpact(): Promise<SystemImpactView> {
  const { data, error } = await supabase
    .from('system_impact_view')
    .select('*')
    .single();

  if (error) throw error;
  return data || {
    total_pickups: 0,
    unique_customers: 0,
    unique_collectors: 0,
    total_kg_collected: 0,
    total_value_generated: 0,
    total_co2_saved: 0,
    total_water_saved: 0,
    total_landfill_saved: 0,
    total_trees_equivalent: 0,
    total_green_scholar_fund: 0,
    total_user_wallet_fund: 0,
    total_points_generated: 0,
    pending_pickups: 0,
    approved_pickups: 0,
    rejected_pickups: 0
  };
}

export async function getMaterialPerformance(): Promise<MaterialPerformanceView[]> {
  const { data, error } = await supabase
    .from('material_performance_view')
    .select('*')
    .order('total_kg_collected', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCollectorPerformance(): Promise<CollectorPerformanceView[]> {
  const { data, error } = await supabase
    .from('collector_performance_view')
    .select('*')
    .order('total_kg_collected', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCustomerPerformance(): Promise<CustomerPerformanceView[]> {
  const { data, error } = await supabase
    .from('customer_performance_view')
    .select('*')
    .order('total_kg_recycled', { ascending: false });

  if (error) throw error;
  return data || [];
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
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} tons`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'paid':
      return 'text-green-600 bg-green-50';
    case 'pending':
    case 'submitted':
      return 'text-yellow-600 bg-yellow-50';
    case 'rejected':
    case 'failed':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
