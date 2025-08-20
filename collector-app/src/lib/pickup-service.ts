import { supabase } from './supabase';
import type { 
  Pickup, 
  PickupItem, 
  PickupPhoto, 
  PickupWithDetails,
  CollectorDashboardView,
  Material 
} from './supabase';

export interface CreatePickupData {
  customer_id: string;
  address_id: string;
  lat?: number;
  lng?: number;
  notes?: string;
  materials: Array<{
    material_id: string;
    kilograms: number;
    contamination_pct?: number;
  }>;
}

export interface PickupStats {
  totalCollections: number;
  totalKg: number;
  totalPoints: number;
  totalEarnings: number;
  monthlyCollections: number;
  monthlyKg: number;
  monthlyPoints: number;
  monthlyEarnings: number;
}

export class PickupService {
  static async getCollectorPickups(collectorId: string): Promise<CollectorDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('collector_dashboard_view')
        .select('*')
        .eq('collector_id', collectorId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pickups:', error);
      return [];
    }
  }

  static async getPickupById(pickupId: string): Promise<PickupWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          customer:profiles!pickups_customer_id_fkey(*),
          collector:profiles!pickups_collector_id_fkey(*),
          address:addresses(*),
          items:pickup_items(*),
          photos:pickup_photos(*)
        `)
        .eq('id', pickupId)
        .single();

      if (error) {
        console.error('Error fetching pickup:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching pickup:', error);
      return null;
    }
  }

  static async createPickup(pickupData: CreatePickupData, collectorId: string): Promise<string | null> {
    try {
      // Start transaction
      const { data: pickup, error: pickupError } = await supabase
        .from('pickups')
        .insert({
          customer_id: pickupData.customer_id,
          collector_id: collectorId,
          address_id: pickupData.address_id,
          started_at: new Date().toISOString(),
          status: 'submitted',
          lat: pickupData.lat,
          lng: pickupData.lng,
        })
        .select('id')
        .single();

      if (pickupError) {
        console.error('Error creating pickup:', pickupError);
        return null;
      }

      // Create pickup items
      const pickupItems = pickupData.materials.map(material => ({
        pickup_id: pickup.id,
        material_id: material.material_id,
        kilograms: material.kilograms,
        contamination_pct: material.contamination_pct || 0,
      }));

      const { error: itemsError } = await supabase
        .from('pickup_items')
        .insert(pickupItems);

      if (itemsError) {
        console.error('Error creating pickup items:', itemsError);
        // Rollback pickup creation
        await supabase.from('pickups').delete().eq('id', pickup.id);
        return null;
      }

      return pickup.id;
    } catch (error) {
      console.error('Error creating pickup:', error);
      return null;
    }
  }

  static async updatePickupStatus(pickupId: string, status: 'submitted' | 'approved' | 'rejected', notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickups')
        .update({
          status,
          approval_note: notes,
          submitted_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', pickupId);

      if (error) {
        console.error('Error updating pickup status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating pickup status:', error);
      return false;
    }
  }

  static async addPickupPhoto(pickupId: string, photoUrl: string, type: 'scale' | 'bags' | 'other', lat?: number, lng?: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickup_photos')
        .insert({
          pickup_id: pickupId,
          url: photoUrl,
          taken_at: new Date().toISOString(),
          type,
          lat,
          lng,
        });

      if (error) {
        console.error('Error adding photo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding photo:', error);
      return false;
    }
  }

  static async getMaterials(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching materials:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  static async getCollectorStats(collectorId: string): Promise<PickupStats> {
    try {
      const pickups = await this.getCollectorPickups(collectorId);
      
      const now = new Date();
      const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      
      const monthlyPickups = pickups.filter(p => p.started_at.startsWith(currentMonth));
      
      return {
        totalCollections: pickups.length,
        totalKg: pickups.reduce((sum, p) => sum + p.total_kg, 0),
        totalPoints: pickups.reduce((sum, p) => sum + p.total_points, 0),
        totalEarnings: pickups.reduce((sum, p) => sum + p.total_value, 0),
        monthlyCollections: monthlyPickups.length,
        monthlyKg: monthlyPickups.reduce((sum, p) => sum + p.total_kg, 0),
        monthlyPoints: monthlyPickups.reduce((sum, p) => sum + p.total_points, 0),
        monthlyEarnings: monthlyPickups.reduce((sum, p) => sum + p.total_value, 0),
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalCollections: 0,
        totalKg: 0,
        totalPoints: 0,
        totalEarnings: 0,
        monthlyCollections: 0,
        monthlyKg: 0,
        monthlyPoints: 0,
        monthlyEarnings: 0,
      };
    }
  }

  static async getCustomers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          addresses(*)
        `)
        .eq('role', 'CUSTOMER')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }
}
