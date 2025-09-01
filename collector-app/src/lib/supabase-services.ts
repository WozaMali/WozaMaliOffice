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

  // Get customer profiles with their addresses using the new view
  async getCustomerProfilesWithAddresses(): Promise<ProfileWithAddresses[]> {
    try {
      console.log('🔍 Debug - Starting getCustomerProfilesWithAddresses with new schema...');
      
      // Use the new collection member user addresses view
      console.log('🔍 Debug - Using collection_member_user_addresses_view...');
      const { data, error } = await supabase
        .from('collection_member_user_addresses_view')
        .select('*');

      if (error) {
        console.error('❌ Error fetching from collection_member_user_addresses_view:', error);
        throw error;
      }

      console.log('📊 Raw data from view:', { 
        count: data?.length || 0, 
        sample: data?.slice(0, 2),
        // Debug name fields specifically
        name_fields_sample: data?.slice(0, 2).map(row => ({
          member_id: row.member_id,
          member_email: row.member_email,
          member_name: row.member_name,
          first_name: row.first_name,
          last_name: row.last_name,
          username: row.username,
          member_phone: row.member_phone,
          role: row.role
        }))
      });

      // Transform the data to group addresses by member and convert to old format
      const memberMap = new Map<string, ProfileWithAddresses>()
      
      data?.forEach((row: any) => {
        const memberId = row.member_id
        
        if (!memberMap.has(memberId)) {
          // Create member record using the correct field names from the view
          memberMap.set(memberId, {
            id: row.member_id,
            email: row.member_email, // Use member_email from view
            first_name: row.first_name, // Now available in updated view
            last_name: row.last_name, // Now available in updated view
            phone: row.member_phone, // Use member_phone from view
            role: row.role, // Use role from view
            is_active: row.member_is_active, // Use is_active from view
            created_at: row.member_since, // Use created_at from view
            updated_at: row.member_since, // Use created_at as updated_at
            addresses: [] // Use addresses property for compatibility
          })
        }
        
        // Add address to member
        const member = memberMap.get(memberId)!
        if (row.address_id) {
          member.addresses!.push({
            id: row.address_id,
            user_id: row.member_id, // Use user_id as per new schema
            address_type: row.address_type,
            address_line1: row.address_line1,
            address_line2: row.address_line2,
            city: row.city,
            province: row.province,
            postal_code: row.postal_code,
            country: row.country,
            coordinates: row.coordinates,
            is_default: row.is_default,
            is_active: row.address_is_active,
            notes: row.notes,
            created_at: row.address_created,
            updated_at: row.address_updated
          })
        }
      })
      
      const result = Array.from(memberMap.values())
      console.log('✅ Transformed data for collector app:', { 
        memberCount: result.length, 
        sample: result.slice(0, 1),
        // Debug name fields in final result
        name_fields_final: result.slice(0, 1).map(member => ({
          id: member.id,
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          username: member.username,
          role: member.role
        }))
      });
      
      return result
    } catch (error) {
      console.error('❌ Error fetching customer profiles with addresses:', error)
      
      // Fallback: Use separate queries
      console.log('🔄 Using fallback approach...');
      return await this.getCustomerProfilesWithAddressesFallback();
    }
  },

  // Fallback method: Get profiles and addresses separately, then combine
  async getCustomerProfilesWithAddressesFallback(): Promise<ProfileWithAddresses[]> {
    try {
      console.log('🔄 Fallback: Fetching profiles and user_addresses separately...');
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('⚠️ No authenticated session found in fallback, cannot fetch profiles');
        return [];
      }
      
      console.log('✅ User authenticated in fallback:', session.user.id);
      
      // Get all customer profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member')
        .eq('is_active', true);

      if (profilesError) {
        console.error('❌ Error fetching profiles in fallback:', profilesError);
        return [];
      }

      if (!profiles || profiles.length === 0) {
        console.log('⚠️ No customer profiles found');
        return [];
      }

      // Get all user addresses
      const { data: userAddresses, error: addressesError } = await supabase
        .from('user_addresses')
        .select('*');

      if (addressesError) {
        console.error('❌ Error fetching user_addresses in fallback:', addressesError);
        return [];
      }

      // Combine profiles with their addresses in old format
      const profilesWithAddresses: ProfileWithAddresses[] = profiles.map(profile => {
        const memberAddresses = userAddresses?.filter(addr => addr.user_id === profile.id) || [];
        
        // Use new address format
        const formattedAddresses = memberAddresses.map(addr => ({
          id: addr.id,
          user_id: addr.user_id,
          address_type: addr.address_type,
          address_line1: addr.address_line1,
          address_line2: addr.address_line2,
          city: addr.city,
          province: addr.province,
          postal_code: addr.postal_code,
          country: addr.country,
          coordinates: addr.coordinates,
          is_default: addr.is_default,
          is_active: addr.is_active,
          notes: addr.notes,
          created_at: addr.created_at,
          updated_at: addr.updated_at
        }));
        
        return {
          ...profile,
          addresses: formattedAddresses
        };
      });

      console.log('✅ Fallback approach successful:', { 
        profilesCount: profiles.length, 
        addressesCount: userAddresses?.length || 0,
        combinedCount: profilesWithAddresses.length 
      });

      return profilesWithAddresses;
    } catch (error) {
      console.error('❌ Error in fallback approach:', error);
      return [];
    }
  }
}

// Address Services - Updated for new user_addresses schema
export const addressServices = {
  // Get addresses for a profile using user_addresses table
  async getAddressesByProfile(profileId: string): Promise<Address[]> {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profileId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching addresses:', error)
      return []
    }
  },

  // Create new address using user_addresses table
  async createAddress(address: Omit<Address, 'id'>): Promise<Address | null> {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
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

  // Update address using user_addresses table
  async updateAddress(addressId: string, updates: Partial<Address>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .update(updates)
        .eq('id', addressId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating address:', error)
      return false
    }
  },

  // Get user addresses using the helper function
  async getUserAddresses(userId: string, requestingUserId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_addresses', {
          target_user_uuid: userId,
          requesting_user_uuid: requestingUserId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user addresses:', error)
      return null
    }
  },

  // Set default address using the helper function
  async setDefaultAddress(addressId: string, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('set_default_address', {
          address_uuid: addressId,
          requesting_user_uuid: userId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error setting default address:', error)
      return null
    }
  },

  // Get default address using the helper function
  async getDefaultAddress(userId: string, addressType?: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_default_address', {
          target_user_uuid: userId,
          address_type_filter: addressType
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching default address:', error)
      return null
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
          pickup_address:user_addresses!pickups_pickup_address_id_fkey(*),
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
