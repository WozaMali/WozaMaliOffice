import { supabase } from './supabase'
import type { 
  Profile, 
  Address, 
  Material, 
  Pickup, 
  PickupItem, 
  PickupPhoto, 
  Payment,
  PickupWithDetails,
  PickupItemWithMaterial,
  ProfileWithAddresses,
  CustomerDashboardView,
  CollectorDashboardView,
  AdminDashboardView,
  SystemImpactView,
  MaterialPerformanceView,
  CollectorPerformanceView,
  CustomerPerformanceView
} from './supabase'

// Profile Services
export const profileServices = {
  // Get profile by ID
  async getProfile(profileId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  },

  // Get profile by email
  async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile by email:', error)
      return null
    }
  },

  // Create or update profile
  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error upserting profile:', error)
      return null
    }
  },

  // Get profiles by role
  async getProfilesByRole(role: Profile['role']): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching profiles by role:', error)
      return []
    }
  },

  // Get customer profiles with their addresses
  async getCustomerProfilesWithAddresses(): Promise<ProfileWithAddresses[]> {
    try {
      console.log('🔍 Debug - Starting getCustomerProfilesWithAddresses...');
      
      // Test 1: Try to access addresses table
      console.log('🔍 Debug - Testing addresses table access...');
      const { data: addressTestData, error: addressTestError } = await supabase
        .from('addresses')
        .select('id, profile_id')
        .limit(1);

      console.log('🔍 Debug - Addresses table test result:', { 
        hasData: !!addressTestData, 
        dataLength: addressTestData?.length || 0, 
        error: addressTestError 
      });

      if (addressTestError) {
        console.error('❌ Cannot access addresses table:', addressTestError);
        throw addressTestError;
      }
      
      // Test 2: Try to access profiles table
      console.log('🔍 Debug - Testing profiles table access...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(1);

      console.log('🔍 Debug - Profiles table test result:', { 
        hasData: !!testData, 
        dataLength: testData?.length || 0, 
        error: testError 
      });

      if (testError) {
        console.error('❌ Cannot access profiles table:', testError);
        throw testError;
      }

      // Test 3: Try the new view first (more reliable)
      console.log('🔍 Debug - Attempting to use customer_profiles_with_addresses_view...');
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('customer_profiles_with_addresses_view')
          .select('*');

        if (!viewError && viewData) {
          console.log('✅ Successfully used view approach:', { count: viewData.length });
          return viewData as ProfileWithAddresses[];
        } else {
          console.log('⚠️ View approach failed, falling back to manual join:', viewError);
        }
      } catch (viewError) {
        console.log('⚠️ View approach failed, falling back to manual join:', viewError);
      }

      // Test 4: Now try the full query with nested select
      console.log('🔍 Debug - Attempting full customer profiles query with nested select...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          addresses(*)
        `)
        .eq('role', 'customer')
        .eq('is_active', true)

      console.log('🔍 Debug - Full query result:', { 
        hasData: !!data, 
        dataLength: data?.length || 0, 
        error: error
      });

      if (error) {
        console.error('❌ Supabase error detected:', error);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error constructor:', error?.constructor?.name);
        console.error('❌ Error keys:', Object.keys(error || {}));
        console.error('❌ Error stringified:', JSON.stringify(error, null, 2));
        console.error('❌ Error toString:', error?.toString());
        
        // Try to extract any available error information
        const errorInfo = {
          message: error?.message || 'No message',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint',
          code: error?.code || 'No code',
          name: error?.name || 'No name',
          stack: error?.stack || 'No stack',
          fullError: error
        };
        
        console.error('❌ Extracted error info:', errorInfo);
        
        // Fallback: Use separate queries and combine manually
        console.log('🔄 Falling back to manual join approach...');
        return await this.getCustomerProfilesWithAddressesFallback();
      }

      console.log('✅ Successfully fetched customer profiles:', { count: data?.length || 0 });
      return data || []
    } catch (error) {
      console.error('❌ Error fetching customer profiles with addresses:', error)
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error stack:', (error as any)?.stack);
      
      // Final fallback: Use separate queries
      console.log('🔄 Using final fallback approach...');
      return await this.getCustomerProfilesWithAddressesFallback();
    }
  },

  // Fallback method: Get profiles and addresses separately, then combine
  async getCustomerProfilesWithAddressesFallback(): Promise<ProfileWithAddresses[]> {
    try {
      console.log('🔄 Fallback: Fetching profiles and addresses separately...');
      
      // Get all customer profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .eq('is_active', true);

      if (profilesError) {
        console.error('❌ Error fetching profiles in fallback:', profilesError);
        return [];
      }

      if (!profiles || profiles.length === 0) {
        console.log('⚠️ No customer profiles found');
        return [];
      }

      // Get all addresses
      const { data: addresses, error: addressesError } = await supabase
        .from('addresses')
        .select('*');

      if (addressesError) {
        console.error('❌ Error fetching addresses in fallback:', addressesError);
        return [];
      }

      // Combine profiles with their addresses
      const profilesWithAddresses: ProfileWithAddresses[] = profiles.map(profile => ({
        ...profile,
        addresses: addresses?.filter(addr => addr.profile_id === profile.id) || []
      }));

      console.log('✅ Fallback approach successful:', { 
        profilesCount: profiles.length, 
        addressesCount: addresses?.length || 0,
        combinedCount: profilesWithAddresses.length 
      });

      return profilesWithAddresses;
    } catch (error) {
      console.error('❌ Error in fallback approach:', error);
      return [];
    }
  }
}

// Address Services
export const addressServices = {
  // Get addresses for a profile
  async getAddressesByProfile(profileId: string): Promise<Address[]> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_primary', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching addresses:', error)
      return []
    }
  },

  // Create new address
  async createAddress(address: Omit<Address, 'id'>): Promise<Address | null> {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert([address])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating address:', error)
      return null
    }
  },

  // Update address
  async updateAddress(addressId: string, updates: Partial<Address>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating address:', error)
      return false
    }
  }
}

// Material Services
export const materialServices = {
  // Get all active materials
  async getActiveMaterials(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching materials:', error)
      return []
    }
  },

  // Get material by ID
  async getMaterial(materialId: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching material:', error)
      return null
    }
  }
}

// Pickup Services
export const pickupServices = {
  // Create a new pickup
  async createPickup(pickupData: Omit<Pickup, 'id' | 'started_at'>): Promise<Pickup | null> {
    try {
      console.log('Supabase createPickup called with:', pickupData);
      
      const { data, error } = await supabase
        .from('pickups')
        .insert([{
          ...pickupData,
          started_at: new Date().toISOString(),
          status: 'submitted'
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating pickup:', error);
        throw error;
      }
      
      console.log('Pickup created successfully:', data);
      return data
    } catch (error) {
      console.error('Error creating pickup:', error)
      throw error; // Re-throw to let the caller handle it
    }
  },

  // Get pickup with full details
  async getPickupWithDetails(pickupId: string): Promise<PickupWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          customer:profiles!pickups_customer_id_fkey(*),
          collector:profiles!pickups_collector_id_fkey(*),
          address:addresses(*),
          items:pickup_items(*),
          photos:pickup_photos(*),
          payment:payments(*)
        `)
        .eq('id', pickupId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching pickup with details:', error)
      return null
    }
  },

  // Get pickups by customer
  async getPickupsByCustomer(customerId: string): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('customer_id', customerId)
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customer pickups:', error)
      return []
    }
  },

  // Get pickups by collector
  async getPickupsByCollector(collectorId: string): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('collector_id', collectorId)
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching collector pickups:', error)
      return []
    }
  },

  // Update pickup status
  async updatePickupStatus(pickupId: string, status: Pickup['status'], approvalNote?: string): Promise<boolean> {
    try {
      const updateData: any = { status }
      if (approvalNote) updateData.approval_note = approvalNote

      const { error } = await supabase
        .from('pickups')
        .update(updateData)
        .eq('id', pickupId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating pickup status:', error)
      return false
    }
  },

  // Submit pickup (set submitted_at)
  async submitPickup(pickupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickups')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', pickupId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error submitting pickup:', error)
      return false
    }
  },

  // Update pickup payment status
  async updatePickupPaymentStatus(pickupId: string, paymentStatus: 'pending' | 'paid' | 'failed', paymentMethod?: string): Promise<boolean> {
    try {
      const updateData: any = { payment_status: paymentStatus }
      if (paymentMethod) updateData.payment_method = paymentMethod

      const { error } = await supabase
        .from('pickups')
        .update(updateData)
        .eq('id', pickupId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating pickup payment status:', error)
      return false
    }
  }
}

// Pickup Item Services
export const pickupItemServices = {
  // Add items to a pickup
  async addPickupItems(pickupId: string, items: Omit<PickupItem, 'id'>[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickup_items')
        .insert(items.map(item => ({ ...item, pickup_id: pickupId })))

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding pickup items:', error)
      return false
    }
  },

  // Get items for a pickup with material details
  async getPickupItemsWithMaterials(pickupId: string): Promise<PickupItemWithMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_items')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('pickup_id', pickupId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pickup items:', error)
      return []
    }
  }
}

// Pickup Photo Services
export const pickupPhotoServices = {
  // Add photos to a pickup
  async addPickupPhotos(pickupId: string, photos: Omit<PickupPhoto, 'id' | 'pickup_id' | 'taken_at'>[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pickup_photos')
        .insert(photos.map(photo => ({
          ...photo,
          pickup_id: pickupId,
          taken_at: new Date().toISOString()
        })))

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding pickup photos:', error)
      return false
    }
  },

  // Get photos for a pickup
  async getPickupPhotos(pickupId: string): Promise<PickupPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_photos')
        .select('*')
        .eq('pickup_id', pickupId)
        .order('taken_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pickup photos:', error)
      return []
    }
  }
}

// Payment Services
export const paymentServices = {
  // Create payment for a pickup
  async createPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating payment:', error)
      return null
    }
  },

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: Payment['status'], method?: string): Promise<boolean> {
    try {
      const updateData: any = { status }
      if (method) updateData.method = method
      if (status === 'approved') updateData.processed_at = new Date().toISOString()

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating payment status:', error)
      return false
    }
  },

  // Get payment by pickup ID
  async getPaymentByPickup(pickupId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('pickup_id', pickupId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching payment:', error)
      return null
    }
  }
}

// Dashboard Services - NEW! Using the installed schema views
export const dashboardServices = {
  // Get collector dashboard data
  async getCollectorDashboard(): Promise<CollectorDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('collector_dashboard_view')
        .select('*')
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching collector dashboard:', error)
      return []
    }
  },

  // Get customer dashboard data
  async getCustomerDashboard(): Promise<CustomerDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('customer_dashboard_view')
        .select('*')
        .order('total_kg_recycled', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customer dashboard:', error)
      return []
    }
  },

  // Get admin dashboard data
  async getAdminDashboard(): Promise<AdminDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_view')
        .select('*')
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
      return []
    }
  }
}

// Analytics Services - NEW! Using the installed schema views
export const analyticsServices = {
  // Get system impact overview
  async getSystemImpact(): Promise<SystemImpactView | null> {
    try {
      const { data, error } = await supabase
        .from('system_impact_view')
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching system impact:', error)
      return null
    }
  },

  // Get material performance analytics
  async getMaterialPerformance(): Promise<MaterialPerformanceView[]> {
    try {
      const { data, error } = await supabase
        .from('material_performance_view')
        .select('*')
        .order('total_kg_collected', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching material performance:', error)
      return []
    }
  },

  // Get collector performance analytics
  async getCollectorPerformance(): Promise<CollectorPerformanceView[]> {
    try {
      const { data, error } = await supabase
        .from('collector_performance_view')
        .select('*')
        .order('total_kg_collected', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching collector performance:', error)
      return []
    }
  },

}

// Customer Services
export const customerServices = {
  // Get customer profile
  async getCustomerProfile(profileId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching customer profile:', error)
      return null
    }
  },

  // Get customer dashboard data
  async getCustomerDashboard(): Promise<CustomerDashboardView[]> {
    try {
      const { data, error } = await supabase
        .from('customer_dashboard_view')
        .select('*')
        .order('total_kg_recycled', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customer dashboard:', error)
      return []
    }
  },

  // Get customer performance analytics
  async getCustomerPerformance(): Promise<CustomerPerformanceView[]> {
    try {
      const { data, error } = await supabase
        .from('customer_performance_view')
        .select('*')
        .order('total_kg_recycled', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customer performance:', error)
      return []
    }
  }
}

// Admin Services
export const adminServices = {
  // Get submitted pickups
  async getSubmittedPickups(): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('status', 'submitted')
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching submitted pickups:', error)
      return []
    }
  },

  // Get pending pickups (alias for submitted)
  async getPendingPickups(): Promise<Pickup[]> {
    return this.getSubmittedPickups();
  },

  // Get approved pickups
  async getApprovedPickups(): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('status', 'approved')
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching approved pickups:', error)
      return []
    }
  },

  // Get completed pickups (alias for approved)
  async getCompletedPickups(): Promise<Pickup[]> {
    return this.getApprovedPickups();
  },

  // Get rejected pickups
  async getRejectedPickups(): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('status', 'rejected')
        .order('started_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching rejected pickups:', error)
      return []
    }
  },

  // Approve pickup
  async approvePickup(pickupId: string, approvalNote?: string): Promise<boolean> {
    return pickupServices.updatePickupStatus(pickupId, 'approved', approvalNote)
  },

  // Reject pickup
  async rejectPickup(pickupId: string, approvalNote: string): Promise<boolean> {
    return pickupServices.updatePickupStatus(pickupId, 'rejected', approvalNote)
  }
}

// Realtime Services
export const realtimeServices = {
  // Subscribe to pickup updates
  subscribeToPickups(callback: (payload: any) => void) {
    return supabase
      .channel('pickup_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, callback)
      .subscribe()
  },

  // Subscribe to payment updates
  subscribeToPayments(callback: (payload: any) => void) {
    return supabase
      .channel('payment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback)
      .subscribe()
  }
}

// Enhanced Pickup Management Services
export const enhancedPickupServices = {
  // Compute totals for a pickup using the new function
  async computePickupTotals(pickupId: string) {
    try {
      const { data, error } = await supabase
        .rpc('compute_pickup_totals', { p_pickup_id: pickupId })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error computing pickup totals:', error)
      return null
    }
  },

  // Finalize a pickup (collector function)
  async finalizePickup(pickupId: string) {
    try {
      const { data, error } = await supabase
        .rpc('finalize_pickup', { p_pickup_id: pickupId })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error finalizing pickup:', error)
      return null
    }
  },

  // Approve a pickup (admin function)
  async approvePickup(pickupId: string, adminId: string) {
    try {
      const { data, error } = await supabase
        .rpc('approve_pickup', { 
          p_pickup_id: pickupId, 
          p_admin_id: adminId 
        })

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error('Error approving pickup:', error)
      return null
    }
  }
}
