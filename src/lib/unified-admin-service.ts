import { supabase } from './supabase';
import type { 
  User, 
  UserWithRole,
  UserComplete,
  Role, 
  Area, 
  Resident,
  TownshipDropdown,
  SubdivisionDropdown,
  Material
} from './supabase';

// ============================================================================
// UNIFIED ADMIN SERVICE
// ============================================================================
// This service handles all admin operations using the unified schema

export interface AdminDashboardData {
  totalUsers: number;
  totalResidents: number;
  totalCollectors: number;
  totalAdmins: number;
  totalCollections: number;
  totalWeight: number;
  totalRevenue: number;
  pendingCollections: number;
  approvedCollections: number;
  rejectedCollections: number;
  totalWallets: number;
  totalWalletBalance: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
}

export interface CollectionData {
  id: string;
  user_id: string;
  collector_id: string;
  pickup_address_id: string;
  material_type: string;
  material_rate_per_kg?: number;
  computed_value?: number;
  weight_kg: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
  };
  collector?: {
    id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
  };
  pickup_address?: {
    id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province?: string;
    postal_code?: string;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export class UnifiedAdminService {
  // ============================================================================
  // DASHBOARD DATA
  // ============================================================================
  static async getDashboardData(): Promise<{ data: AdminDashboardData | null; error: any }> {
    try {
      // Get user counts by role with fallback to profiles
      let { data: userCounts, error: userError } = await supabase
        .from('users')
        .select('role_id, status')
        .eq('status', 'active');

      let roleMap = new Map<string, string>();
      if (userError) {
        console.debug('users table not available; falling back to profiles for counts');
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('is_active', true);
        if (profilesErr) {
          console.debug('profiles not available, defaulting counts to zero');
          userCounts = [] as any;
        } else {
          // Build synthetic counts with role names
          userCounts = (profiles || []).map((p: any) => ({ role_id: p.role, status: 'active' })) as any;
          // Role map is identity for string role names
          roleMap = new Map((['resident','collector','admin'] as string[]).map(r => [r, r]));
        }
      }

      // Get role names if using users/roles schema
      if (roleMap.size === 0) {
      const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, name');
      if (roleError) {
          console.debug('roles table not available; using raw role_id');
          roleMap = new Map();
        } else {
          roleMap = new Map(roles?.map((r: any) => [r.id, r.name]) || []);
        }
      }
      
      let totalResidents = 0;
      let totalCollectors = 0;
      let totalAdmins = 0;

      userCounts?.forEach(user => {
        const roleName = roleMap.get(user.role_id);
        if (roleName === 'resident') totalResidents++;
        else if (roleName === 'collector') totalCollectors++;
        else if (roleName === 'admin') totalAdmins++;
      });

      // Get collection data (prefer unified_collections, fallback to collections)
      let collectionsResp = await supabase
        .from('unified_collections')
        .select('*');
      if (collectionsResp.error) {
        collectionsResp = await supabase
        .from('collections')
        .select('*');
      }
      const collections = collectionsResp.data as any[] | null;
      const collectionsError = collectionsResp.error;

      if (collectionsError) {
        console.debug('collections not available; defaulting to zero collections');
        return { data: {
          totalUsers: userCounts?.length || 0,
          totalResidents: 0,
          totalCollectors: 0,
          totalAdmins: 0,
          totalCollections: 0,
          totalWeight: 0,
          totalRevenue: 0,
          pendingCollections: 0,
          approvedCollections: 0,
          rejectedCollections: 0,
          totalWallets: 0,
          totalWalletBalance: 0,
          totalPointsEarned: 0,
          totalPointsSpent: 0
        }, error: null };
      }

      const totalCollections = collections?.length || 0;
      const totalWeight = collections?.reduce((sum, c: any) => sum + (c.weight_kg ?? c.total_weight_kg ?? 0), 0) || 0;
      const pendingCollections = collections?.filter((c: any) => c.status === 'pending' || c.status === 'submitted').length || 0;
      const approvedCollections = collections?.filter((c: any) => c.status === 'approved').length || 0;
      const rejectedCollections = collections?.filter((c: any) => c.status === 'rejected').length || 0;
      // Include both approved and completed collections in revenue/points
      const revenueStatuses = new Set(['approved', 'completed']);
      const approvedKg = (collections || [])
        .filter((c: any) => revenueStatuses.has(c.status))
        .reduce((sum: number, c: any) => sum + (c.weight_kg ?? c.total_weight_kg ?? 0), 0);

      // Compute Total Revenue from unified_collections stored values
      // Sum computed_value (fallback total_value) for all non-rejected rows
      let computedRevenue = 0;
      try {
        const { data: ucRows, error: ucErr } = await supabase
          .from('unified_collections')
          .select('status, computed_value, total_value')
          .neq('status', 'rejected');
        const rows = (!ucErr && Array.isArray(ucRows)) ? ucRows : [];
        computedRevenue = rows.reduce((sum: number, r: any) => sum + (Number(r.computed_value ?? r.total_value) || 0), 0);
      } catch (_e) {
        // keep computedRevenue at 0 on error
      }

      // Fallback: derive revenue from collection_materials if stored totals are zero
      if (!computedRevenue) {
        try {
          const { data: idRows, error: idErr } = await supabase
            .from('unified_collections')
            .select('id')
            .neq('status', 'rejected');
          const ids = (!idErr && Array.isArray(idRows)) ? idRows.map((r: any) => r.id) : [];
          if (ids.length > 0) {
            const { data: mats, error: matsErr } = await supabase
              .from('collection_materials')
              .select('collection_id, quantity, unit_price')
              .in('collection_id', ids);
            if (!matsErr && Array.isArray(mats)) {
              computedRevenue = mats.reduce((sum: number, m: any) => sum + ((Number(m.quantity) || 0) * (Number(m.unit_price) || 0)), 0);
            }
          }
        } catch (_e) {
          // ignore and keep computedRevenue as-is
        }
      }

      // Get wallet data with fallback
      let walletsResp = await supabase
        .from('user_wallets')
        .select('current_points, total_points_earned, total_points_spent');
      if (walletsResp.error && (walletsResp.error.code === 'PGRST205' || walletsResp.error.message?.includes("Could not find the table 'public.user_wallets'"))) {
        console.debug('user_wallets not found, falling back to wallets');
        walletsResp = await supabase
          .from('wallets')
          .select('balance, total_points');
      }
      if (walletsResp.error) {
        console.debug('wallet tables not available; deriving wallet totals from approved collections');
        // 1kg = 1 point: derive points from approved kg
        const derivedPoints = approvedKg;
        const dashboardData: AdminDashboardData = {
          totalUsers: userCounts?.length || 0,
          totalResidents,
          totalCollectors,
          totalAdmins,
          totalCollections,
          totalWeight,
          totalRevenue: computedRevenue,
          pendingCollections,
          approvedCollections,
          rejectedCollections,
          totalWallets: 0,
          totalWalletBalance: derivedPoints,
          totalPointsEarned: derivedPoints,
          totalPointsSpent: 0
        };
        return { data: dashboardData, error: null };
      }
      const wallets = walletsResp.data as any[] || [];
      const totalWallets = wallets.length;
      // 1kg = 1 point display: use approvedKg as the single source of truth for dashboard
      const totalWalletBalance = approvedKg; // shown as "Total Point Balance"
      const totalPointsEarned = approvedKg;
      const totalPointsSpent = 0;

      const dashboardData: AdminDashboardData = {
        totalUsers: userCounts?.length || 0,
        totalResidents,
        totalCollectors,
        totalAdmins,
        totalCollections,
        totalWeight,
        totalRevenue: computedRevenue,
        pendingCollections,
        approvedCollections,
        rejectedCollections,
        totalWallets,
        totalWalletBalance,
        totalPointsEarned,
        totalPointsSpent
      };

      return { data: dashboardData, error: null };
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // USERS MANAGEMENT
  // ============================================================================
  static async getAllUsers(): Promise<{ data: UserComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*),
          township:areas(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return { data: null, error };
    }
  }

  static async getUsersByRole(roleName: string): Promise<{ data: User[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('role.name', roleName)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users by role:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return { data: null, error };
    }
  }

  static async createUser(userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role_name: string;
    township_id?: string;
    subdivision?: string;
    street_addr?: string;
    city?: string;
    postal_code?: string;
  }): Promise<{ data: User | null; error: any }> {
    try {
      // Get role ID
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', userData.role_name)
        .single();

      if (roleError || !role) {
        console.error('Error getting role:', roleError);
        return { data: null, error: roleError };
      }

      // Create user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          phone: userData.phone,
          role_id: role.id,
          township_id: userData.township_id,
          subdivision: userData.subdivision,
          street_addr: userData.street_addr,
          city: userData.city || 'Soweto',
          postal_code: userData.postal_code,
          status: 'active'
        })
        .select(`
          *,
          role:roles(*),
          area:areas(*)
        `)
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return { data: null, error: userError };
      }

      return { data: newUser, error: null };
    } catch (error) {
      console.error('Error in createUser:', error);
      return { data: null, error };
    }
  }

  static async updateUser(userId: string, updateData: Partial<User>): Promise<{ data: User | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select(`
          *,
          role:roles(*),
          area:areas(*)
        `)
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateUser:', error);
      return { data: null, error };
    }
  }

  static async deleteUser(userId: string): Promise<{ data: boolean | null; error: any }> {
    try {
      // Check if user has collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .or(`user_id.eq.${userId},collector_id.eq.${userId}`)
        .limit(1);

      if (collectionsError) {
        console.error('Error checking collections:', collectionsError);
        return { data: null, error: collectionsError };
      }

      if (collections && collections.length > 0) {
        return { data: null, error: new Error('Cannot delete user with existing collections') };
      }

      // Delete user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return { data: null, error };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // COLLECTIONS MANAGEMENT
  // ============================================================================
  static async getAllCollections(): Promise<{ data: CollectionData[] | null; error: any }> {
    try {
      // Prefer unified_collections (has denormalized names/addresses). Fallback to legacy collections
      let isUnified = true;
      let baseResp = await supabase
        .from('unified_collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (baseResp.error) {
        isUnified = false;
        baseResp = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });
      }

      if (baseResp.error) {
        console.error('Error fetching collections:', baseResp.error);
        return { data: null, error: baseResp.error };
      }

      const rows = (baseResp.data as any[]) || [];
      if (rows.length === 0) return { data: [], error: null };

      // Collect related IDs
      const customerIds = isUnified ? [] : Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
      const collectorIds = isUnified ? [] : Array.from(new Set(rows.map(r => r.collector_id).filter(Boolean)));
      const addressIds = isUnified ? [] : Array.from(new Set(rows.map(r => r.pickup_address_id).filter(Boolean)));

      // For unified rows, prepare optional fallback user lookups when denormalized names are missing
      let unifiedCollectorMap = new Map<string, any>();
      if (isUnified) {
        const unifiedCollectorIds = Array.from(new Set(
          rows
            .map((r: any) => r.collector_id || r.created_by || r.updated_by)
            .filter(Boolean)
        ));
        if (unifiedCollectorIds.length > 0) {
          const { data: unifiedCollectors } = await supabase
            .from('users')
            .select('id, full_name, email, phone')
            .in('id', unifiedCollectorIds);
          (unifiedCollectors || []).forEach((u: any) => unifiedCollectorMap.set(String(u.id), u));
        }
      }
      const materialNames = Array.from(new Set(rows.map(r => (r.material_type || '').toLowerCase()).filter(Boolean)));

      // Fetch related users, addresses, and material rates with separate queries
      const [{ data: customers }, { data: collectors }, { data: addresses }, { data: materials }] = await Promise.all([
        customerIds.length > 0
          ? supabase.from('users').select('id, first_name, last_name, full_name, email, phone').in('id', customerIds)
          : Promise.resolve({ data: [] as any[] } as any),
        collectorIds.length > 0
          ? supabase.from('users').select('id, first_name, last_name, full_name, email, phone').in('id', collectorIds)
          : Promise.resolve({ data: [] as any[] } as any),
        !isUnified && addressIds.length > 0
          ? supabase
              .from('user_addresses')
              .select('id, address_line1, address_line2, city, province, postal_code')
              .in('id', addressIds)
          : Promise.resolve({ data: [] as any[] } as any),
        // Fetch materials with current rate and id for lookups
        supabase.from('materials').select('id, name, current_rate, is_active')
      ]);

      // Build a map of material id -> current_rate for fallback
      const matNameToRate = new Map((materials || []).map((m: any) => [String(m.name).toLowerCase(), Number(m.current_rate) || 0]));
      const matIdToRate = new Map((materials || []).map((m: any) => [String(m.id || ''), Number(m.current_rate) || 0]));
      const matIdToName = new Map((materials || []).map((m: any) => [String(m.id || ''), String(m.name || '')]));

      // Fetch collection items to derive rate/value independent of name spelling
      const { data: items } = await supabase
        .from('collection_materials')
        .select('id, collection_id, material_id, quantity, unit_price');
      const itemsByCollection = new Map<string, any[]>();
      (items || []).forEach((it: any) => {
        if (!itemsByCollection.has(it.collection_id)) itemsByCollection.set(it.collection_id, []);
        itemsByCollection.get(it.collection_id)!.push(it);
      });

      const collections: CollectionData[] = rows.map(r => {
        const list = itemsByCollection.get(r.id) || [];
        const totalQty = list.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        // Pick top item by quantity
        const top = list.slice().sort((a,b)=> (Number(b.quantity)||0)-(Number(a.quantity)||0))[0];
        const rateFromName = matNameToRate.get(String(r.material_type || '').toLowerCase()) || 0;
        const rateFromItem = top ? (Number(top.unit_price) || matIdToRate.get(String(top.material_id || '')) || 0) : 0;
        const kg = (typeof r.weight_kg === 'number' ? r.weight_kg : (typeof r.total_weight_kg === 'number' ? r.total_weight_kg : totalQty)) || 0;
        // Prefer stored total_value when present
        const storedTotalValue = typeof r.total_value === 'number' ? r.total_value : 0;
        let materialRate = rateFromItem || rateFromName || 0;
        let computedValue = list.length > 0
          ? list.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unit_price)||materialRate), 0)
          : (materialRate > 0 ? kg * materialRate : 0);
        if (storedTotalValue > 0) {
          computedValue = storedTotalValue;
          if (kg > 0 && materialRate === 0) {
            materialRate = storedTotalValue / kg;
          }
        }

        // Derive display material name if missing
        const displayMaterialType = r.material_type
          || (top && (matIdToName.get(String(top.material_id || '')) || 'Unknown'))
          || 'Unknown';
        const customer = isUnified
          ? { id: r.customer_id, full_name: r.customer_name, email: r.customer_email, phone: r.customer_phone }
          : (customers || []).find((u: any) => u.id === r.user_id) || null;
        const collector = isUnified
          ? (() => {
              const cid = r.collector_id || r.created_by || r.updated_by;
              if (!cid) return null;
              // Prefer denormalized name/email, else fallback to users map
              const fallback = unifiedCollectorMap.get(String(cid));
              return {
                id: cid,
                first_name: undefined,
                last_name: undefined,
                full_name: (r.collector_name && String(r.collector_name).trim()) || fallback?.full_name || 'Unassigned',
                email: (r.collector_email && String(r.collector_email).trim()) || fallback?.email || '',
                phone: r.collector_phone || fallback?.phone || ''
              };
            })()
          : (collectors || []).find((u: any) => u.id === r.collector_id) || null;
        const address = isUnified
          ? (r.pickup_address ? { id: null, address_line1: r.pickup_address, address_line2: '', city: '', province: '', postal_code: '' } : null)
          : (addresses || []).find((a: any) => a.id === r.pickup_address_id) || null;

        return {
          id: r.id,
          user_id: r.user_id,
          collector_id: r.collector_id,
          pickup_address_id: r.pickup_address_id,
          material_type: displayMaterialType,
          material_rate_per_kg: materialRate,
          computed_value: computedValue,
          weight_kg: kg,
          status: r.status,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
          customer: customer && {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone
          },
          collector: collector && {
            id: collector.id,
            first_name: collector.first_name,
            last_name: collector.last_name,
            full_name: collector.full_name,
            email: collector.email,
            phone: collector.phone
          },
          pickup_address: address && {
            id: address.id,
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            province: address.province,
            postal_code: address.postal_code
          }
        } as CollectionData;
      });

      return { data: collections, error: null };
    } catch (error) {
      console.error('Error in getAllCollections:', error);
      return { data: null, error };
    }
  }

  static async updateCollectionStatus(collectionId: string, status: string, notes?: string): Promise<{ data: CollectionData | null; error: any }> {
    try {
      // Use RPCs for approved/rejected to ensure wallet/fund/points post atomically
      if (status === 'approved' || status === 'rejected') {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user?.id) {
          console.error('Error getting current user for approver_id:', authErr);
          return { data: null, error: authErr || new Error('Not authenticated') };
        }

        if (status === 'approved') {
          const { error: rpcErr } = await supabase.rpc('approve_collection', {
            p_collection_id: collectionId,
            p_approver_id: authData.user.id,
            p_note: notes ?? null,
            p_idempotency_key: null
          });
          // Treat only populated errors as blocking; some environments return an empty object
          if (rpcErr && (rpcErr as any).message) {
            console.error('Error approving collection via RPC:', rpcErr);
            // Fallback: directly mark approved to ensure decision is saved
            const direct = await supabase
              .from('unified_collections')
              .update({ status: 'approved', admin_notes: notes, updated_at: new Date().toISOString() })
              .eq('id', collectionId)
              .select('*')
              .maybeSingle();
            if (direct.error) {
              // Try legacy collections as last resort
              const legacy = await supabase
                .from('collections')
                .update({ status: 'approved', notes, updated_at: new Date().toISOString() })
                .eq('id', collectionId)
                .select('*')
                .maybeSingle();
              if (legacy.error) return { data: null, error: rpcErr };
            }
          }
        } else {
          const { error: rpcErr } = await supabase.rpc('reject_collection', {
            p_collection_id: collectionId,
            p_approver_id: authData.user.id,
            p_note: notes ?? null
          });
          if (rpcErr && (rpcErr as any).message) {
            console.error('Error rejecting collection via RPC:', rpcErr);
            // Fallback: directly mark rejected to ensure decision is saved
            const direct = await supabase
              .from('unified_collections')
              .update({ status: 'rejected', admin_notes: notes, updated_at: new Date().toISOString() })
              .eq('id', collectionId)
              .select('*')
              .maybeSingle();
            if (direct.error) {
              const legacy = await supabase
                .from('collections')
                .update({ status: 'rejected', notes, updated_at: new Date().toISOString() })
                .eq('id', collectionId)
                .select('*')
                .maybeSingle();
              if (legacy.error) return { data: null, error: rpcErr };
            }
          }
        }

        // Fetch the updated row to return (prefer unified_collections)
        let fetchErr: any = null;
        let row: any = null;
        let resp = await supabase
          .from('unified_collections')
          .select('*')
          .eq('id', collectionId)
          .maybeSingle();
        if (resp.error || !resp.data) {
          const legacy = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
            .maybeSingle();
          fetchErr = legacy.error;
          row = legacy.data;
        } else {
          row = resp.data;
        }
        if (!row && fetchErr) {
          console.error('Error fetching collection after RPC:', fetchErr);
          return { data: null, error: fetchErr };
        }
        return { data: row as any, error: null };
      }

      // Non-approval status updates fall back to direct update on unified_collections
      const { data, error } = await supabase
        .from('unified_collections')
        .update({
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating collection status:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateCollectionStatus:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // TOWNSHIPS & SUBDIVISIONS
  // ============================================================================
  static async getTownships(): Promise<{ data: TownshipDropdown[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('township_dropdown')
        .select('*')
        .order('township_name');

      if (error) {
        console.error('Error fetching townships:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getTownships:', error);
      return { data: null, error };
    }
  }

  static async getSubdivisions(townshipId: string): Promise<{ data: SubdivisionDropdown[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('subdivision_dropdown')
        .select('*')
        .eq('area_id', townshipId)
        .order('subdivision');

      if (error) {
        console.error('Error fetching subdivisions:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getSubdivisions:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // MATERIALS
  // ============================================================================
  static async getMaterials(): Promise<{ data: Material[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching materials:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getMaterials:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // RECENT ACTIVITY
  // ============================================================================
  static async getRecentActivity(limit: number = 20): Promise<{ data: RecentActivity[] | null; error: any }> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent collections
      const { data: recentCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, status, created_at, updated_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (collectionsError) {
        console.error('Error fetching recent collections:', collectionsError);
      } else if (recentCollections) {
        // Get customer names
        const customerIds = recentCollections.map(c => c.user_id).filter(Boolean);
        const { data: customers } = customerIds.length > 0 ? await supabase
          .from('users')
          .select('id, first_name, last_name, full_name')
          .in('id', customerIds) : { data: [] };

        recentCollections.forEach(collection => {
          const customer = customers?.find(c => c.id === collection.user_id);
          const customerName = customer?.full_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Customer';
          
          if (collection.status === 'pending' || collection.status === 'submitted') {
            activities.push({
              id: collection.id,
              type: 'collection_created',
              title: 'New Collection Submitted',
              description: `${customerName} - Collection ${collection.id} submitted`,
              timestamp: collection.created_at,
              metadata: { collection_id: collection.id, customer_name: customerName }
            });
          } else if (collection.status === 'approved') {
            activities.push({
              id: collection.id,
              type: 'collection_approved',
              title: 'Collection Approved',
              description: `${customerName} - Collection ${collection.id} approved`,
              timestamp: collection.updated_at || collection.created_at,
              metadata: { collection_id: collection.id, customer_name: customerName }
            });
          } else if (collection.status === 'rejected') {
            activities.push({
              id: collection.id,
              type: 'collection_rejected',
              title: 'Collection Rejected',
              description: `${customerName} - Collection ${collection.id} rejected`,
              timestamp: collection.updated_at || collection.created_at,
              metadata: { collection_id: collection.id, customer_name: customerName }
            });
          }
        });
      }

      // Get recent user registrations
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, full_name, role_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (usersError) {
        console.error('Error fetching recent users:', usersError);
      } else if (recentUsers) {
        // Get role names
        const roleIds = recentUsers.map(u => u.role_id).filter(Boolean);
        const { data: roles } = roleIds.length > 0 ? await supabase
          .from('roles')
          .select('id, name')
          .in('id', roleIds) : { data: [] };

        recentUsers.forEach(user => {
          const role = roles?.find(r => r.id === user.role_id);
          const userName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
          
          activities.push({
            id: user.id,
            type: 'user_registered',
            title: 'New User Registered',
            description: `${userName} (${role?.name || 'Unknown Role'})`,
            timestamp: user.created_at,
            metadata: { user_id: user.id, user_name: userName, role: role?.name }
          });
        });
      }

      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return { data: sortedActivities, error: null };
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // WALLET DATA
  // ============================================================================
  static async getWalletData(): Promise<{ data: any | null; error: any }> {
    try {
      // Try unified table then fallback to legacy wallets
      let walletsResp = await supabase
        .from('user_wallets')
        .select('*')
        .order('current_points', { ascending: false });
      if (walletsResp.error && (walletsResp.error.code === 'PGRST205' || walletsResp.error.message?.includes("Could not find the table 'public.user_wallets'"))) {
        console.warn('⚠️ user_wallets not found, falling back to wallets');
        walletsResp = await supabase
          .from('wallets')
          .select('*')
          .order('balance', { ascending: false });
      }
      if (walletsResp.error) {
        console.error('Error fetching wallet data:', walletsResp.error);
        return { data: null, error: walletsResp.error };
      }

      const wallets = walletsResp.data as any[] || [];
      const totalWallets = wallets.length;
      const totalWalletBalance = wallets.reduce((sum: number, w: any) => sum + (w.current_points ?? w.balance ?? 0), 0) || 0;
      const totalPointsEarned = wallets.reduce((sum: number, w: any) => sum + (w.total_points_earned ?? w.total_points ?? 0), 0) || 0;
      const totalPointsSpent = wallets.reduce((sum: number, w: any) => sum + (w.total_points_spent ?? 0), 0) || 0;

      return {
        data: {
          wallets: wallets || [],
          totalWallets,
          totalWalletBalance,
          totalPointsEarned,
          totalPointsSpent,
          totalLifetimeEarnings: totalPointsEarned
        },
        error: null
      };
    } catch (error) {
      console.error('Error in getWalletData:', error);
      return { data: null, error };
    }
  }
}

// ============================================================================
// HOOKS FOR REACT COMPONENTS
// ============================================================================

import { useState, useEffect } from 'react';

export function useDashboardData() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await UnifiedAdminService.getDashboardData();

      if (error) {
        setError(error);
      } else {
        setData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

export function useAllUsers() {
  const [users, setUsers] = useState<UserComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await UnifiedAdminService.getAllUsers();

      if (error) {
        setError(error);
      } else {
        setUsers(data || []);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

export function useCollections() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await UnifiedAdminService.getAllCollections();

      if (error) {
        setError(error);
      } else {
        setCollections(data || []);
      }

      setLoading(false);
    };

    fetchCollections();
  }, []);

  return { collections, loading, error };
}

export function useTownships() {
  const [townships, setTownships] = useState<TownshipDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTownships = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await UnifiedAdminService.getTownships();

      if (error) {
        setError(error);
      } else {
        setTownships(data || []);
      }

      setLoading(false);
    };

    fetchTownships();
  }, []);

  return { townships, loading, error };
}

export function useSubdivisions(townshipId: string | null) {
  const [subdivisions, setSubdivisions] = useState<SubdivisionDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!townshipId) {
      setSubdivisions([]);
      return;
    }

    const fetchSubdivisions = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await UnifiedAdminService.getSubdivisions(townshipId);

      if (error) {
        setError(error);
      } else {
        setSubdivisions(data || []);
      }

      setLoading(false);
    };

    fetchSubdivisions();
  }, [townshipId]);

  return { subdivisions, loading, error };
}
