import { supabase } from './supabase';
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
// PICKUPS MANAGEMENT (SIMPLIFIED)
// ============================================================================

export async function getPickups(): Promise<TransformedPickup[]> {
  console.log('🔍 Fetching pickups from Supabase...');
  
  try {
    // Fetch basic pickup data without complex joins
    const { data: pickupsData, error } = await supabase
      .from('pickups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching pickups:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    // Fetch customer profiles separately (using user_id instead of customer_id)
    const customerIds = Array.from(new Set(pickupsData?.map(p => p.user_id).filter(Boolean) || []));
    const { data: customerProfiles } = customerIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', customerIds) : { data: [] };

    // Fetch collector profiles separately (using collector_id if it exists, otherwise null)
    const collectorIds = Array.from(new Set(pickupsData?.map(p => p.collector_id).filter(Boolean) || []));
    const { data: collectorProfiles } = collectorIds.length > 0 ? await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', collectorIds) : { data: [] };

    // Fetch addresses separately
    const addressIds = Array.from(new Set(pickupsData?.map(p => p.address_id).filter(Boolean) || []));
    const { data: addresses } = addressIds.length > 0 ? await supabase
      .from('addresses')
      .select('id, line1, suburb, city, postal_code')
      .in('id', addressIds) : { data: [] };

    // Fetch pickup items separately for each pickup
    const pickupIds = pickupsData?.map(p => p.id) || [];
    const { data: pickupItemsData } = pickupIds.length > 0 ? await supabase
      .from('pickup_items')
      .select('id, pickup_id, kilograms, contamination_pct, material_id')
      .in('pickup_id', pickupIds) : { data: [] };

    // Fetch materials separately
    const materialIds = Array.from(new Set(pickupItemsData?.map(pi => pi.material_id).filter(Boolean) || []));
    const { data: materialsData } = materialIds.length > 0 ? await supabase
      .from('materials')
      .select('id, name, rate_per_kg')
      .in('id', materialIds) : { data: [] };

    // Transform the data and calculate totals
    const transformedPickups = (pickupsData || []).map(pickup => {
      const customer = customerProfiles?.find(p => p.id === pickup.user_id);
      const collector = collectorProfiles?.find(p => p.id === pickup.collector_id);
      const address = addresses?.find(a => a.id === pickup.address_id);

      // Get pickup items for this pickup
      const pickupItems = pickupItemsData?.filter(pi => pi.pickup_id === pickup.id) || [];
      
      // Calculate totals from pickup items
      const totalKg = pickupItems.reduce((sum: number, item: any) => sum + (item.kilograms || 0), 0);
      const totalValue = pickupItems.reduce((sum: number, item: any) => {
        const material = materialsData?.find(m => m.id === item.material_id);
        const rate = material?.rate_per_kg || 0;
        return sum + ((item.kilograms || 0) * rate);
      }, 0);

      return {
        ...pickup,
        total_kg: totalKg,
        total_value: totalValue,
        customer: customer ? {
          full_name: customer.full_name || 'Unknown',
          email: customer.email,
          phone: customer.phone
        } : null,
        collector: collector ? {
          full_name: collector.full_name || 'Unassigned',
          email: collector.email,
          phone: collector.phone
        } : null,
        address: address ? {
          line1: address.line1,
          suburb: address.suburb,
          city: address.city,
          postal_code: address.postal_code
        } : null
      };
    });

    console.log('✅ Pickups fetched successfully:', transformedPickups.length, 'pickups found');
    if (transformedPickups.length > 0) {
      console.log('📊 Sample pickup data:', {
        id: transformedPickups[0].id,
        user_id: transformedPickups[0].user_id,
        total_kg: transformedPickups[0].total_kg,
        total_value: transformedPickups[0].total_value,
        customer: transformedPickups[0].customer?.full_name
      });
    }
    return transformedPickups;
  } catch (error) {
    console.error('❌ Exception in getPickups:', error);
    throw error;
  }
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
  console.log(`🔄 Updating pickup ${pickupId} status to: ${status}`);
  
  try {
    // First update the pickup status
    const { error: updateError } = await supabase
      .from('pickups')
      .update({ 
        status, 
        approval_note: approvalNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', pickupId);

    if (updateError) {
      console.error('❌ Error updating pickup status:', updateError);
      throw updateError;
    }

    // Then fetch the updated pickup with customer info separately
    const { data: pickupData, error: fetchError } = await supabase
      .from('pickups')
      .select('*')
      .eq('id', pickupId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated pickup:', fetchError);
      throw fetchError;
    }

    // Fetch customer info separately
    let customerInfo = null;
    if (pickupData.user_id) {
      const { data: customerData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', pickupData.user_id)
        .single();
      
      customerInfo = customerData;
    }

    console.log(`✅ Pickup status updated successfully:`, {
      pickupId,
      newStatus: status,
      customer: customerInfo?.full_name || 'Unknown',
      customerEmail: customerInfo?.email || 'No email'
    });

    // The real-time subscription will automatically notify all connected clients
    // including the customer dashboard running on the other repository
    console.log('📡 Real-time update sent to all connected clients (admin, customer, collector dashboards)');

    return {
      ...pickupData,
      customer: customerInfo
    };
  } catch (error) {
    console.error('❌ Exception in updatePickupStatus:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENTS & WITHDRAWALS
// ============================================================================

export async function getPayments(): Promise<Payment[]> {
  console.log('🔍 Fetching payments from Supabase...');
  
  try {
    // Fetch payments with simple query
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching payments:', error);
      throw error;
    }

    // Fetch pickup details separately (note: pickups don't have total_kg/total_value columns)
    const pickupIds = Array.from(new Set(paymentsData?.map(p => p.pickup_id).filter(Boolean) || []));
    const { data: pickups } = pickupIds.length > 0 ? await supabase
      .from('pickups')
      .select('id, user_id')
      .in('id', pickupIds) : { data: [] };

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

    // Get recent pickups
    console.log('🔍 Fetching recent pickups...');
    const { data: recentPickups, error: pickupsError } = await supabase
      .from('pickups')
      .select('id, status, created_at, updated_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pickupsError) {
      console.error('❌ Error fetching recent pickups:', pickupsError);
      console.error('❌ Error details:', {
        message: pickupsError.message,
        details: pickupsError.details,
        hint: pickupsError.hint,
        code: pickupsError.code
      });
    } else if (recentPickups) {
      console.log('✅ Recent pickups fetched:', recentPickups.length, 'pickups found');
      // Fetch customer names for the pickups
      const customerIds = Array.from(new Set(recentPickups.map(p => p.user_id).filter(Boolean)));
      const { data: customerProfiles } = customerIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds) : { data: [] };

      recentPickups.forEach(pickup => {
        const customer = customerProfiles?.find(p => p.id === pickup.user_id);
        if (pickup.status === 'submitted') {
          activities.push({
            id: pickup.id,
            type: 'pickup_created',
            title: 'New Pickup Submitted',
            description: `${customer?.full_name || 'Customer'} - Pickup submitted`,
            timestamp: pickup.created_at,
            metadata: { pickup_id: pickup.id, customer: customer }
          });
        } else if (pickup.status === 'approved') {
          activities.push({
            id: pickup.id,
            type: 'pickup_approved',
            title: 'Pickup Approved',
            description: `${customer?.full_name || 'Customer'} - Pickup approved`,
            timestamp: pickup.updated_at || pickup.created_at,
            metadata: { pickup_id: pickup.id, customer: customer }
          });
        } else if (pickup.status === 'rejected') {
          activities.push({
            id: pickup.id,
            type: 'pickup_rejected',
            title: 'Pickup Rejected',
            description: `${customer?.full_name || 'Customer'} - Pickup rejected`,
            timestamp: pickup.updated_at || pickup.created_at,
            metadata: { pickup_id: pickup.id, customer: customer }
          });
        }
      });
    }

    // Get recent user registrations
    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching recent users:', usersError);
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
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
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
// ANALYTICS FUNCTIONS (MISSING IMPORTS)
// ============================================================================

export async function getSystemImpact() {
  console.log('🔍 Fetching system impact data...');
  
  try {
    // Get total kilograms collected
    const { data: pickupItems, error: itemsError } = await supabase
      .from('pickup_items')
      .select('kilograms, material_id');

    if (itemsError) {
      console.error('❌ Error fetching pickup items:', itemsError);
      throw itemsError;
    }

    // Get materials for impact calculations
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, name, co2_saved_per_kg, water_saved_per_kg, energy_saved_per_kg');

    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError);
      throw materialsError;
    }

    // Calculate totals
    const totalKg = pickupItems?.reduce((sum, item) => sum + (item.kilograms || 0), 0) || 0;
    const totalCO2Saved = pickupItems?.reduce((sum, item) => {
      const material = materials?.find(m => m.id === item.material_id);
      return sum + ((item.kilograms || 0) * (material?.co2_saved_per_kg || 0));
    }, 0) || 0;
    const totalWaterSaved = pickupItems?.reduce((sum, item) => {
      const material = materials?.find(m => m.id === item.material_id);
      return sum + ((item.kilograms || 0) * (material?.water_saved_per_kg || 0));
    }, 0) || 0;
    const totalEnergySaved = pickupItems?.reduce((sum, item) => {
      const material = materials?.find(m => m.id === item.material_id);
      return sum + ((item.kilograms || 0) * (material?.energy_saved_per_kg || 0));
    }, 0) || 0;

    console.log('✅ System impact data fetched successfully');
    return {
      totalKg,
      totalCO2Saved,
      totalWaterSaved,
      totalEnergySaved,
      materialsProcessed: materials?.length || 0
    };
  } catch (error) {
    console.error('❌ Exception in getSystemImpact:', error);
    throw error;
  }
}

export async function getMaterialPerformance() {
  console.log('🔍 Fetching material performance data...');
  
  try {
    // Get pickup items with material data
    const { data: pickupItems, error: itemsError } = await supabase
      .from('pickup_items')
      .select(`
        kilograms,
        material_id,
        materials (
          id,
          name,
          rate_per_kg
        )
      `);

    if (itemsError) {
      console.error('❌ Error fetching pickup items:', itemsError);
      throw itemsError;
    }

    // Group by material and calculate totals
    const materialStats = pickupItems?.reduce((acc: any, item: any) => {
      const materialId = item.material_id;
      const material = item.materials;
      
      if (!acc[materialId]) {
        acc[materialId] = {
          id: materialId,
          name: material?.name || 'Unknown Material',
          totalKg: 0,
          totalValue: 0,
          ratePerKg: material?.rate_per_kg || 0
        };
      }
      
      acc[materialId].totalKg += item.kilograms || 0;
      acc[materialId].totalValue += (item.kilograms || 0) * (material?.rate_per_kg || 0);
      
      return acc;
    }, {}) || {};

    const performanceData = Object.values(materialStats).sort((a: any, b: any) => b.totalKg - a.totalKg);

    console.log('✅ Material performance data fetched successfully');
    return performanceData;
  } catch (error) {
    console.error('❌ Exception in getMaterialPerformance:', error);
    throw error;
  }
}

export async function getCollectorPerformance() {
  console.log('🔍 Fetching collector performance data...');
  
  try {
    // Get pickups with collector data
    const { data: pickups, error: pickupsError } = await supabase
      .from('pickups')
      .select(`
        id,
        collector_id,
        created_at,
        profiles!collector_id (
          id,
          full_name,
          email
        )
      `)
      .not('collector_id', 'is', null);

    if (pickupsError) {
      console.error('❌ Error fetching pickups:', pickupsError);
      throw pickupsError;
    }

    // Get pickup items for each pickup
    const pickupIds = pickups?.map(p => p.id) || [];
    let pickupItems: any[] = [];
    let itemsError: any = null;
    
    if (pickupIds.length > 0) {
      const { data: pickupItemsData, error: itemsErrorData } = await supabase
        .from('pickup_items')
        .select('pickup_id, kilograms')
        .in('pickup_id', pickupIds);
      
      pickupItems = pickupItemsData || [];
      itemsError = itemsErrorData;
    }

    if (itemsError) {
      console.error('❌ Error fetching pickup items:', itemsError);
      throw itemsError;
    }

    // Group by collector and calculate performance
    const collectorStats = pickups?.reduce((acc: any, pickup: any) => {
      const collectorId = pickup.collector_id;
      const collector = pickup.profiles;
      
      if (!acc[collectorId]) {
        acc[collectorId] = {
          id: collectorId,
          name: collector?.full_name || 'Unknown Collector',
          email: collector?.email || '',
          totalPickups: 0,
          totalKg: 0,
          lastActivity: null
        };
      }
      
      acc[collectorId].totalPickups += 1;
      acc[collectorId].lastActivity = pickup.created_at;
      
      // Add kilograms from pickup items
      const items = pickupItems?.filter(item => item.pickup_id === pickup.id) || [];
      const pickupKg = items.reduce((sum, item) => sum + (item.kilograms || 0), 0);
      acc[collectorId].totalKg += pickupKg;
      
      return acc;
    }, {}) || {};

    const performanceData = Object.values(collectorStats).sort((a: any, b: any) => b.totalKg - a.totalKg);

    console.log('✅ Collector performance data fetched successfully');
    return performanceData;
  } catch (error) {
    console.error('❌ Exception in getCollectorPerformance:', error);
    throw error;
  }
}

export async function getCustomerPerformance() {
  console.log('🔍 Fetching customer performance data...');
  
  try {
    // Get pickups with customer data
    const { data: pickups, error: pickupsError } = await supabase
      .from('pickups')
      .select(`
        id,
        user_id,
        created_at,
        profiles!user_id (
          id,
          full_name,
          email
        )
      `);

    if (pickupsError) {
      console.error('❌ Error fetching pickups:', pickupsError);
      throw pickupsError;
    }

    // Get pickup items for each pickup
    const pickupIds = pickups?.map(p => p.id) || [];
    let pickupItems: any[] = [];
    let itemsError: any = null;
    
    if (pickupIds.length > 0) {
      const { data: pickupItemsData, error: itemsErrorData } = await supabase
        .from('pickup_items')
        .select('pickup_id, kilograms')
        .in('pickup_id', pickupIds);
      
      pickupItems = pickupItemsData || [];
      itemsError = itemsErrorData;
    }

    if (itemsError) {
      console.error('❌ Error fetching pickup items:', itemsError);
      throw itemsError;
    }

    // Group by customer and calculate performance
    const customerStats = pickups?.reduce((acc: any, pickup: any) => {
      const customerId = pickup.user_id;
      const customer = pickup.profiles;
      
      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: customer?.full_name || 'Unknown Customer',
          email: customer?.email || '',
          totalPickups: 0,
          totalKg: 0,
          lastActivity: null
        };
      }
      
      acc[customerId].totalPickups += 1;
      acc[customerId].lastActivity = pickup.created_at;
      
      // Add kilograms from pickup items
      const items = pickupItems?.filter(item => item.pickup_id === pickup.id) || [];
      const pickupKg = items.reduce((sum, item) => sum + (item.kilograms || 0), 0);
      acc[customerId].totalKg += pickupKg;
      
      return acc;
    }, {}) || {};

    const performanceData = Object.values(customerStats).sort((a: any, b: any) => b.totalKg - a.totalKg);

    console.log('✅ Customer performance data fetched successfully');
    return performanceData;
  } catch (error) {
    console.error('❌ Exception in getCustomerPerformance:', error);
    throw error;
  }
}