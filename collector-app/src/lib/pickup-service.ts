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
  address_id: string | null;
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
        console.error('Error fetching pickups from Supabase:', {
          error: error,
          errorType: typeof error,
          errorKeys: Object.keys(error),
          fullError: JSON.stringify(error, null, 2)
        });
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
      console.log('🚀 createPickup function called!');
      console.log('1. Pickup data:', pickupData);
      console.log('2. Collector ID:', collectorId);
      
      // Start transaction
      console.log('4. Attempting to insert pickup with data:', {
        customer_id: pickupData.customer_id,
        collector_id: collectorId,
        address_id: pickupData.address_id,
        started_at: new Date().toISOString(),
        status: 'submitted',
        lat: pickupData.lat,
        lng: pickupData.lng,
      });
      
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

      console.log('5. Supabase response:', { pickup, pickupError });

      if (pickupError) {
        console.error('🚨 PICKUP ERROR DETECTED! 🚨');
        console.error('Raw pickupError:', pickupError);
        console.error('pickupError type:', typeof pickupError);
        console.error('pickupError === null:', pickupError === null);
        console.error('pickupError === undefined:', pickupError === undefined);
        console.error('pickupError === {}:', JSON.stringify(pickupError) === '{}');
        console.error('pickupError keys:', Object.keys(pickupError));
        console.error('pickupError length:', Object.keys(pickupError).length);
        console.error('pickupError stringified:', JSON.stringify(pickupError, null, 2));
        console.error('pickupError message:', pickupError?.message);
        console.error('pickupError code:', pickupError?.code);
        console.error('pickupError details:', pickupError?.details);
        console.error('pickupError hint:', pickupError?.hint);
        console.error('Full error object:', pickupError);
        return null;
      }

      // Create pickup items
      const pickupItems = pickupData.materials.map(material => ({
        pickup_id: pickup.id,
        material_id: material.material_id,
        kilograms: material.kilograms,
        contamination_pct: material.contamination_pct || 0,
      }));

      console.log('3. Pickup items to create:', pickupItems);

      const { error: itemsError } = await supabase
        .from('pickup_items')
        .insert(pickupItems);

      if (itemsError) {
        console.error('Error creating pickup items from Supabase:', {
          error: itemsError,
          errorType: typeof itemsError,
          errorKeys: Object.keys(itemsError),
          fullError: JSON.stringify(itemsError, null, 2),
          errorMessage: itemsError?.message || 'No message',
          errorCode: itemsError?.code || 'No code',
          errorDetails: itemsError?.details || 'No details',
          hint: itemsError?.hint || 'No hint'
        });
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

  static async getUsers(): Promise<any[]> {
    try {
      console.log('=== STARTING getUsers() ===');
      console.log('1. Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('2. Supabase client exists:', !!supabase);
      
      // Test connection first
      console.log('3. Testing basic connection...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      console.log('4. Connection test result:', { testData, testError });
      
      console.log('5. Fetching member profiles...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone
        `)
        .eq('role', 'member');

      console.log('6. Main query result:', { data, error });
      
      if (error) {
        console.error('Error fetching users from Supabase:', {
          error: error,
          errorType: typeof error,
          errorKeys: Object.keys(error),
          fullError: JSON.stringify(error, null, 2),
          errorMessage: error?.message || 'No message',
          errorCode: error?.code || 'No code',
          errorDetails: error?.details || 'No details'
        });
        return [];
      }

      console.log('Successfully fetched users:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching users (catch block):', error);
      return [];
    }
  }
}
