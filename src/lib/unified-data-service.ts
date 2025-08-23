import { supabase } from './supabase';

// Unified interfaces for shared data
export interface UnifiedPickup {
  id: string;
  customer_id: string;
  collector_id?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  started_at: string;
  submitted_at?: string;
  completed_at?: string;
  total_kg?: number;
  total_value?: number;
  notes?: string;
  
  // Customer information
  customer: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  
  // Address information
  address: {
    line1: string;
    suburb: string;
    city: string;
    postal_code?: string;
  };
  
  // Pickup items with materials
  items: Array<{
    id: string;
    material_id: string;
    material_name: string;
    kilograms: number;
    rate_per_kg: number;
    value: number;
    notes?: string;
  }>;
  
  // Environmental impact
  environmental_impact: {
    co2_saved: number;
    water_saved: number;
    landfill_saved: number;
    trees_equivalent: number;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UnifiedCustomer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'COLLECTOR' | 'ADMIN' | 'STAFF';
  is_active: boolean;
  
  // Statistics
  total_pickups: number;
  total_kg_recycled: number;
  total_value_earned: number;
  total_co2_saved: number;
  
  // Address
  addresses: Array<{
    id: string;
    line1: string;
    suburb: string;
    city: string;
    postal_code?: string;
    is_primary: boolean;
  }>;
  
  // Recent pickups
  recent_pickups: Array<{
    id: string;
    status: string;
    started_at: string;
    total_kg: number;
    total_value: number;
  }>;
  
  created_at: string;
  updated_at: string;
}

export interface UnifiedCollector {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'COLLECTOR';
  is_active: boolean;
  
  // Performance metrics
  total_pickups_assigned: number;
  total_pickups_completed: number;
  total_kg_collected: number;
  total_value_generated: number;
  
  // Current assignments
  active_pickups: Array<{
    id: string;
    customer_name: string;
    address: string;
    status: string;
    started_at: string;
    total_kg?: number;
  }>;
  
  // Availability
  is_available: boolean;
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
  
  created_at: string;
  updated_at: string;
}

export interface UnifiedSystemStats {
  // Overall system metrics
  total_users: number;
  total_pickups: number;
  total_kg_recycled: number;
  total_value_generated: number;
  total_co2_saved: number;
  
  // User breakdown
  customers_count: number;
  collectors_count: number;
  admins_count: number;
  
  // Pickup status breakdown
  pending_pickups: number;
  approved_pickups: number;
  in_progress_pickups: number;
  completed_pickups: number;
  rejected_pickups: number;
  
  // Performance metrics
  average_pickup_value: number;
  average_pickup_weight: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  
  // Real-time status
  last_sync: string;
  active_collectors: number;
  realtime_connections: number;
}

// Unified Data Service Class
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  
  public static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  // Get unified pickup data (shared between admin and collector)
  async getUnifiedPickups(filters?: {
    status?: string;
    customer_id?: string;
    collector_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: UnifiedPickup[]; error: any }> {
    try {
      // First, get the basic pickup data
      let query = supabase
        .from('pickups')
        .select('*')
        .order('started_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.collector_id) {
        query = query.eq('collector_id', filters.collector_id);
      }
      if (filters?.date_from) {
        query = query.gte('started_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('started_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
      }

      const { data: pickups, error: pickupsError } = await query;

      if (pickupsError) {
        return { data: [], error: pickupsError };
      }

      if (!pickups || pickups.length === 0) {
        return { data: [], error: null };
      }

      // Now get the related data separately to avoid foreign key constraint issues
      const pickupIds = pickups.map(p => p.id);
      const customerIds = pickups.map(p => p.customer_id).filter((id, index, arr) => arr.indexOf(id) === index);
      const addressIds = pickups.map(p => p.address_id).filter((id, index, arr) => arr.indexOf(id) === index);

      // Get customers
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .in('id', customerIds);

      if (customersError) {
        return { data: [], error: customersError };
      }

      // Get addresses
      const { data: addresses, error: addressesError } = await supabase
        .from('addresses')
        .select('id, line1, suburb, city, postal_code')
        .in('id', addressIds);

      if (addressesError) {
        return { data: [], error: addressesError };
      }

      // Get pickup items with materials
      const { data: pickupItems, error: itemsError } = await supabase
        .from('pickup_items')
        .select(`
          id,
          pickup_id,
          material_id,
          kilograms,
          notes,
          material:materials(
            id,
            name,
            rate_per_kg
          )
        `)
        .in('pickup_id', pickupIds);

      if (itemsError) {
        return { data: [], error: itemsError };
      }

      // Create lookup maps for efficient data access
      const customersMap = new Map(customers?.map(c => [c.id, c]) || []);
      const addressesMap = new Map(addresses?.map(a => [a.id, a]) || []);
      const itemsMap = new Map();
      
      // Group items by pickup_id
      pickupItems?.forEach(item => {
        if (!itemsMap.has(item.pickup_id)) {
          itemsMap.set(item.pickup_id, []);
        }
        itemsMap.get(item.pickup_id).push(item);
      });

      // Process and unify the data
      const unifiedPickups: UnifiedPickup[] = pickups.map(pickup => {
        const customer = customersMap.get(pickup.customer_id);
        const address = addressesMap.get(pickup.address_id);
        const items = itemsMap.get(pickup.id) || [];

        const processedItems = items.map((item: any) => ({
          id: item.id,
          material_id: item.material_id,
          material_name: item.material?.name || 'Unknown',
          kilograms: item.kilograms || 0,
          rate_per_kg: item.material?.rate_per_kg || 0,
          value: (item.kilograms || 0) * (item.material?.rate_per_kg || 0),
          notes: item.notes
        }));

        // Calculate environmental impact
        const totalKg = processedItems.reduce((sum: number, item: any) => sum + item.kilograms, 0);
        const environmental_impact = {
          co2_saved: totalKg * 2.5, // Approximate CO2 saved per kg
          water_saved: totalKg * 25, // Approximate water saved per kg
          landfill_saved: totalKg * 0.8, // Approximate landfill saved per kg
          trees_equivalent: (totalKg * 2.5) / 22 // 22 kg CO2 = 1 tree
        };

        return {
          id: pickup.id,
          customer_id: pickup.customer_id,
          collector_id: pickup.collector_id,
          status: pickup.status,
          started_at: pickup.started_at,
          submitted_at: pickup.submitted_at,
          completed_at: pickup.completed_at,
          total_kg: pickup.total_kg,
          total_value: pickup.total_value,
          notes: pickup.notes,
          customer: {
            id: customer?.id || '',
            full_name: customer?.full_name || 'Unknown',
            email: customer?.email || '',
            phone: customer?.phone || ''
          },
          address: {
            line1: address?.line1 || '',
            suburb: address?.suburb || '',
            city: address?.city || '',
            postal_code: address?.postal_code || ''
          },
          items: processedItems,
          environmental_impact,
          created_at: pickup.created_at,
          updated_at: pickup.updated_at
        };
      });

      return { data: unifiedPickups, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get unified customer data
  async getUnifiedCustomers(filters?: {
    is_active?: boolean;
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: UnifiedCustomer[]; error: any }> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          addresses(
            id,
            line1,
            suburb,
            city,
            postal_code,
            is_primary
          )
        `)
        .eq('role', 'CUSTOMER')
        .order('full_name', { ascending: true });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error };
      }

      // Get additional statistics for each customer
      const customersWithStats = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: pickups } = await supabase
            .from('pickups')
            .select('id, status, started_at, total_kg, total_value')
            .eq('customer_id', customer.id)
            .order('started_at', { ascending: false })
            .limit(5);

          const totalPickups = pickups?.length || 0;
          const totalKg = pickups?.reduce((sum, p) => sum + (p.total_kg || 0), 0) || 0;
          const totalValue = pickups?.reduce((sum, p) => sum + (p.total_value || 0), 0) || 0;
          const totalCO2 = totalKg * 2.5;

          return {
            id: customer.id,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            role: customer.role,
            is_active: customer.is_active,
            total_pickups: totalPickups,
            total_kg_recycled: totalKg,
            total_value_earned: totalValue,
            total_co2_saved: totalCO2,
            addresses: customer.addresses || [],
            recent_pickups: pickups || [],
            created_at: customer.created_at,
            updated_at: customer.updated_at
          };
        })
      );

      return { data: customersWithStats, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get unified collector data
  async getUnifiedCollectors(filters?: {
    is_active?: boolean;
    is_available?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: UnifiedCollector[]; error: any }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COLLECTOR')
        .order('full_name', { ascending: true });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error };
      }

      // Get additional statistics for each collector
      const collectorsWithStats = await Promise.all(
        (data || []).map(async (collector) => {
          // Get pickups for this collector with simple queries to avoid foreign key issues
          const { data: pickups } = await supabase
            .from('pickups')
            .select('id, status, started_at, total_kg, total_value, customer_id, address_id')
            .eq('collector_id', collector.id)
            .order('started_at', { ascending: false });

          const totalAssigned = pickups?.length || 0;
          const totalCompleted = pickups?.filter(p => p.status === 'completed').length || 0;
          const totalKg = pickups?.reduce((sum, p) => sum + (p.total_kg || 0), 0) || 0;
          const totalValue = pickups?.reduce((sum, p) => sum + (p.total_value || 0), 0) || 0;

          // Get customer and address information separately to avoid join issues
          const customerIds = pickups?.map(p => p.customer_id).filter((id, index, arr) => arr.indexOf(id) === index) || [];
          const addressIds = pickups?.map(p => p.address_id).filter((id, index, arr) => arr.indexOf(id) === index && id !== null) || [];

          const [customersResult, addressesResult] = await Promise.all([
            customerIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', customerIds) : { data: [], error: null },
            addressIds.length > 0 ? supabase.from('addresses').select('id, line1, suburb, city').in('id', addressIds) : { data: [], error: null }
          ]);

          const customersMap = new Map(customersResult.data?.map(c => [c.id, c]) || []);
          const addressesMap = new Map(addressesResult.data?.map(a => [a.id, a]) || []);

          const activePickups = pickups
            ?.filter(p => ['submitted', 'approved', 'in_progress'].includes(p.status))
            .map(p => {
              const customer = customersMap.get(p.customer_id);
              const address = addressesMap.get(p.address_id);
              
              return {
                id: p.id,
                customer_name: customer?.full_name || 'Unknown',
                address: address ? `${address.line1 || ''}, ${address.suburb || ''}, ${address.city || ''}` : 'No address',
                status: p.status,
                started_at: p.started_at,
                total_kg: p.total_kg
              };
            }) || [];

          return {
            id: collector.id,
            full_name: collector.full_name,
            email: collector.email,
            phone: collector.phone,
            role: collector.role,
            is_active: collector.is_active,
            total_pickups_assigned: totalAssigned,
            total_pickups_completed: totalCompleted,
            total_kg_collected: totalKg,
            total_value_generated: totalValue,
            active_pickups: activePickups,
            is_available: true, // Default to true, can be updated based on business logic
            created_at: collector.created_at,
            updated_at: collector.updated_at
          };
        })
      );

      return { data: collectorsWithStats, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get unified system statistics
  async getUnifiedSystemStats(): Promise<{ data: UnifiedSystemStats | null; error: any }> {
    try {
      const [
        profilesResult,
        pickupsResult,
        pickupItemsResult,
        activeProfilesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, role, is_active'),
        supabase.from('pickups').select('*'),
        supabase.from('pickup_items').select('kilograms'),
        supabase.from('profiles').select('id, role').eq('is_active', true)
      ]);

      if (profilesResult.error || pickupsResult.error || pickupItemsResult.error || activeProfilesResult.error) {
        throw new Error('Failed to fetch system data');
      }

      const profiles = profilesResult.data || [];
      const pickups = pickupsResult.data || [];
      const pickupItems = pickupItemsResult.data || [];
      const activeProfiles = activeProfilesResult.data || [];

      // Calculate system statistics
      const totalKgRecycled = pickupItems.reduce((sum, item) => sum + (item.kilograms || 0), 0);
      const totalValueGenerated = pickupItems.reduce((sum, item) => sum + (item.kilograms || 0) * 1.5, 0);
      const totalCO2Saved = totalKgRecycled * 2.5;

      const customersCount = profiles.filter(p => p.role === 'CUSTOMER').length;
      const collectorsCount = profiles.filter(p => p.role === 'COLLECTOR').length;
      const adminsCount = profiles.filter(p => ['ADMIN', 'STAFF'].includes(p.role)).length;

      const pendingPickups = pickups.filter(p => p.status === 'submitted').length;
      const approvedPickups = pickups.filter(p => p.status === 'approved').length;
      const inProgressPickups = pickups.filter(p => p.status === 'in_progress').length;
      const completedPickups = pickups.filter(p => p.status === 'completed').length;
      const rejectedPickups = pickups.filter(p => p.status === 'rejected').length;

      const averagePickupValue = pickups.length > 0 ? totalValueGenerated / pickups.length : 0;
      const averagePickupWeight = pickups.length > 0 ? totalKgRecycled / pickups.length : 0;

      // Determine system health
      let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
      if (pendingPickups > 10) systemHealth = 'warning';
      if (pendingPickups > 20) systemHealth = 'critical';

      const stats: UnifiedSystemStats = {
        total_users: profiles.length,
        total_pickups: pickups.length,
        total_kg_recycled: totalKgRecycled,
        total_value_generated: totalValueGenerated,
        total_co2_saved: totalCO2Saved,
        customers_count: customersCount,
        collectors_count: collectorsCount,
        admins_count: adminsCount,
        pending_pickups: pendingPickups,
        approved_pickups: approvedPickups,
        in_progress_pickups: inProgressPickups,
        completed_pickups: completedPickups,
        rejected_pickups: rejectedPickups,
        average_pickup_value: averagePickupValue,
        average_pickup_weight: averagePickupWeight,
        system_health: systemHealth,
        last_sync: new Date().toISOString(),
        active_collectors: activeProfiles.filter(p => p.role === 'COLLECTOR').length,
        realtime_connections: 3 // Pickups, items, profiles
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Real-time subscription setup for unified data
  setupUnifiedRealtimeSubscriptions(callbacks: {
    onPickupChange?: (payload: any) => void;
    onCustomerChange?: (payload: any) => void;
    onCollectorChange?: (payload: any) => void;
    onSystemChange?: (payload: any) => void;
  }) {
    const channels = [];

    // Pickups channel
    if (callbacks.onPickupChange) {
      const pickupsChannel = supabase
        .channel('unified_pickups_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pickups' }, 
          callbacks.onPickupChange
        )
        .subscribe();
      channels.push(pickupsChannel);
    }

    // Customers channel
    if (callbacks.onCustomerChange) {
      const customersChannel = supabase
        .channel('unified_customers_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          (payload) => {
            if (payload.new?.role === 'CUSTOMER' || payload.old?.role === 'CUSTOMER') {
              callbacks.onCustomerChange!(payload);
            }
          }
        )
        .subscribe();
      channels.push(customersChannel);
    }

    // Collectors channel
    if (callbacks.onCollectorChange) {
      const collectorsChannel = supabase
        .channel('unified_collectors_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          (payload) => {
            if (payload.new?.role === 'COLLECTOR' || payload.old?.role === 'COLLECTOR') {
              callbacks.onCollectorChange!(payload);
            }
          }
        )
        .subscribe();
      channels.push(collectorsChannel);
    }

    // System-wide changes
    if (callbacks.onSystemChange) {
      const systemChannel = supabase
        .channel('unified_system_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public' }, 
          callbacks.onSystemChange
        )
        .subscribe();
      channels.push(systemChannel);
    }

    // Return cleanup function
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }
}

// Export singleton instance
export const unifiedDataService = UnifiedDataService.getInstance();
