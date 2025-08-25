import { supabase } from './supabase';

export interface Customer {
  id: string;
  profile_id: string;
  name: string;
  surname: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  suburb: string;
  city: string;
  postal_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerSearchResult {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  suburb: string;
  city: string;
  postal_code?: string;
}

// Search customers by address (partial match)
export async function searchCustomersByAddress(address: string): Promise<CustomerSearchResult[]> {
  try {
    console.log('🔍 Searching customers by address:', address);
    
    if (!address.trim()) {
      return [];
    }

    // Search in addresses table and join with profiles
    const { data, error } = await supabase
      .from('addresses')
      .select(`
        id,
        profile_id,
        line1,
        suburb,
        city,
        postal_code,
        profiles!inner(
          id,
          full_name,
          phone,
          email,
          is_active
        )
      `)
      .or(`line1.ilike.%${address}%,suburb.ilike.%${address}%,city.ilike.%${address}%`)
      .eq('profiles.is_active', true)
      .limit(10);

    if (error) {
      console.error('❌ Error searching customers:', error);
      throw error;
    }

    // Transform the data to match our interface
    const customers: CustomerSearchResult[] = data?.map(item => ({
      id: item.id,
      profile_id: item.profile_id,
      full_name: item.profiles?.full_name || 'Unknown',
      phone: item.profiles?.phone || '',
      email: item.profiles?.email || '',
      address: `${item.line1}, ${item.suburb}, ${item.city}`,
      suburb: item.suburb,
      city: item.city,
      postal_code: item.postal_code,
    })) || [];

    console.log('✅ Found customers:', customers.length);
    return customers;
  } catch (error) {
    console.error('❌ Error in searchCustomersByAddress:', error);
    throw error;
  }
}

// Get customer by ID with full details
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    console.log('🔍 Getting customer by ID:', customerId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        is_active,
        created_at,
        addresses!inner(
          id,
          line1,
          suburb,
          city,
          postal_code,
          is_primary
        )
      `)
      .eq('id', customerId)
      .eq('role', 'customer')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error getting customer:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ Customer not found');
      return null;
    }

    // Get primary address
    const primaryAddress = data.addresses?.find(addr => addr.is_primary) || data.addresses?.[0];
    
    const customer: Customer = {
      id: data.id,
      profile_id: data.id,
      name: data.full_name?.split(' ')[0] || '',
      surname: data.full_name?.split(' ').slice(1).join(' ') || '',
      full_name: data.full_name || '',
      phone: data.phone || '',
      email: data.email,
      address: primaryAddress ? `${primaryAddress.line1}, ${primaryAddress.suburb}, ${primaryAddress.city}` : '',
      suburb: primaryAddress?.suburb || '',
      city: primaryAddress?.city || '',
      postal_code: primaryAddress?.postal_code,
      is_active: data.is_active,
      created_at: data.created_at,
    };

    console.log('✅ Customer retrieved:', customer.full_name);
    return customer;
  } catch (error) {
    console.error('❌ Error in getCustomerById:', error);
    throw error;
  }
}

// Get all active customers
export async function getAllActiveCustomers(): Promise<Customer[]> {
  try {
    console.log('🔍 Getting all active customers');
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        is_active,
        created_at,
        addresses(
          id,
          line1,
          suburb,
          city,
          postal_code,
          is_primary
        )
      `)
      .eq('role', 'customer')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('❌ Error getting customers:', error);
      throw error;
    }

    const customers: Customer[] = data?.map(profile => {
      const primaryAddress = profile.addresses?.find(addr => addr.is_primary) || profile.addresses?.[0];
      
      return {
        id: profile.id,
        profile_id: profile.id,
        name: profile.full_name?.split(' ')[0] || '',
        surname: profile.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email,
        address: primaryAddress ? `${primaryAddress.line1}, ${primaryAddress.suburb}, ${primaryAddress.city}` : '',
        suburb: primaryAddress?.suburb || '',
        city: primaryAddress?.city || '',
        postal_code: primaryAddress?.postal_code,
        is_active: profile.is_active,
        created_at: profile.created_at,
      };
    }) || [];

    console.log('✅ Retrieved customers:', customers.length);
    return customers;
  } catch (error) {
    console.error('❌ Error in getAllActiveCustomers:', error);
    throw error;
  }
}

// Subscribe to customer changes for real-time updates
export function subscribeToCustomerChanges(callback: (payload: any) => void) {
  return supabase
    .channel('customer_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'profiles' 
    }, (payload) => {
      console.log('🔄 Customer change detected:', payload);
      callback(payload);
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'addresses' 
    }, (payload) => {
      console.log('🔄 Address change detected:', payload);
      callback(payload);
    })
    .subscribe();
}
