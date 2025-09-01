import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

console.log('🔌 Creating Supabase client with:');
console.log('🔌 URL:', supabaseUrl);
console.log('🔌 Key length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('✅ Supabase client created successfully');

// Database types matching your new schema
export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'customer' | 'collector' | 'admin'
  is_active: boolean
  created_at: string
}

// Legacy address interface (for backward compatibility)
export interface Address {
  id: string
  profile_id: string
  line1: string
  suburb: string
  city: string
  postal_code?: string
  lat?: number
  lng?: number
  is_primary: boolean
}

// New user address interface matching the user_addresses schema
export interface UserAddress {
  id: string
  user_id: string
  address_type: 'primary' | 'secondary' | 'pickup' | 'billing'
  address_line1: string
  address_line2?: string
  city: string
  province: string
  postal_code?: string
  country: string
  coordinates?: { x: number; y: number } // POINT type representation
  is_default: boolean
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  name: string
  unit: string
  rate_per_kg: number
  is_active: boolean
}

export interface Pickup {
  id: string
  customer_id: string
  collector_id: string
  address_id?: string // Made optional to match new schema
  pickup_address_id?: string // New field for user_addresses reference
  started_at: string
  submitted_at?: string
  lat?: number
  lng?: number
  status: 'submitted' | 'approved' | 'rejected'
  approval_note?: string
  total_kg?: number
  total_value?: number
  payment_status?: 'pending' | 'paid' | 'failed'
  payment_method?: string
  customer_name?: string
  collector_name?: string
  pickup_date?: string
}

export interface PickupItem {
  id: string
  pickup_id: string
  material_id: string
  kilograms: number
  contamination_pct?: number
}

export interface PickupPhoto {
  id: string
  pickup_id: string
  url: string
  taken_at: string
  lat?: number
  lng?: number
  type?: 'scale' | 'bags' | 'other'
}

export interface Payment {
  id: string
  pickup_id: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  processed_at?: string
  method?: string
}

// Extended types for UI convenience
export interface PickupWithDetails extends Pickup {
  customer?: Profile
  collector?: Profile
  address?: Address // Legacy address
  pickup_address?: UserAddress // New user address
  items?: PickupItemWithMaterial[]
  photos?: PickupPhoto[]
  payment?: Payment
}

export interface PickupItemWithMaterial extends PickupItem {
  material?: Material
}

export interface ProfileWithAddresses extends Profile {
  addresses?: Address[] // Legacy addresses
  user_addresses?: UserAddress[] // New user addresses
}

// New interface for member with user addresses
export interface MemberWithUserAddresses extends Profile {
  user_addresses?: UserAddress[]
  wallet_balance?: number
  total_points?: number
  tier?: string
  total_pickups?: number
  last_pickup_date?: string
}

// NEW: Dashboard View Types
export interface CustomerDashboardView {
  pickup_id: string
  status: string
  started_at: string
  submitted_at?: string
  total_kg: number
  total_value: number
  environmental_impact: {
    co2_saved: number
    water_saved: number
    landfill_saved: number
    trees_equivalent: number
  }
  fund_allocation: {
    green_scholar_fund: number
    user_wallet: number
    total_value: number
  }
  total_points: number
  materials_breakdown: Array<{
    material_name: string
    weight_kg: number
    rate_per_kg: number
    value: number
    points: number
    impact: {
      co2_saved: number
      water_saved: number
      landfill_saved: number
      trees_equivalent: number
    }
  }>
  photo_count: number
  collector_name?: string
  collector_phone?: string
  line1?: string
  suburb?: string
  city?: string
  postal_code?: string
}

export interface CollectorDashboardView {
  pickup_id: string
  status: string
  started_at: string
  submitted_at?: string
  total_kg: number
  total_value: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  line1?: string
  suburb?: string
  city?: string
  postal_code?: string
  environmental_impact: {
    co2_saved: number
    water_saved: number
    landfill_saved: number
    trees_equivalent: number
  }
  fund_allocation: {
    green_scholar_fund: number
    user_wallet: number
    total_value: number
  }
  total_points: number
  materials_breakdown: Array<{
    material_name: string
    weight_kg: number
    rate_per_kg: number
    value: number
    points: number
    impact: {
      co2_saved: number
      water_saved: number
      landfill_saved: number
      trees_equivalent: number
    }
  }>
  photo_count: number
  payment_status?: string
  payment_amount?: number
  payment_method?: string
}

export interface AdminDashboardView {
  pickup_id: string
  status: string
  started_at: string
  submitted_at?: string
  total_kg: number
  total_value: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  collector_name?: string
  collector_phone?: string
  line1?: string
  suburb?: string
  city?: string
  postal_code?: string
  environmental_impact: {
    co2_saved: number
    water_saved: number
    landfill_saved: number
    trees_equivalent: number
  }
  fund_allocation: {
    green_scholar_fund: number
    user_wallet: number
    total_value: number
  }
  total_points: number
  materials_breakdown: Array<{
    material_name: string
    weight_kg: number
    rate_per_kg: number
    value: number
    points: number
    impact: {
      co2_saved: number
      water_saved: number
      landfill_saved: number
      trees_equivalent: number
    }
  }>
  photo_count: number
  payment_status?: string
  payment_amount?: number
  payment_method?: string
  payment_processed_at?: string
  approval_note?: string
}

// NEW: Analytics Types
export interface SystemImpactView {
  total_pickups: number
  unique_customers: number
  unique_collectors: number
  total_kg_collected: number
  total_value_generated: number
  total_co2_saved: number
  total_water_saved: number
  total_landfill_saved: number
  total_trees_equivalent: number
  total_green_scholar_fund: number
  total_user_wallet_fund: number
  total_points_generated: number
  pending_pickups: number
  approved_pickups: number
  rejected_pickups: number
}

export interface MaterialPerformanceView {
  material_name: string
  category: string
  rate_per_kg: number
  pickup_count: number
  total_kg_collected: number
  total_value_generated: number
  avg_kg_per_pickup: number
  total_co2_saved: number
  total_water_saved: number
  total_landfill_saved: number
  total_points_generated: number
}

export interface CollectorPerformanceView {
  collector_id: string
  collector_name: string
  collector_email: string
  collector_phone: string
  total_pickups: number
  total_kg_collected: number
  total_value_generated: number
  total_co2_saved: number
  total_water_saved: number
  total_points_generated: number
  pending_pickups: number
  approved_pickups: number
  rejected_pickups: number
  last_pickup_date?: string
}

export interface CustomerPerformanceView {
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_pickups: number
  total_kg_recycled: number
  total_value_earned: number
  total_co2_saved: number
  total_water_saved: number
  total_points_earned: number
  total_green_scholar_contribution: number
  total_wallet_balance: number
  last_recycling_date?: string
}
