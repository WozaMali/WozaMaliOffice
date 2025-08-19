import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  address_id: string
  started_at: string
  submitted_at?: string
  lat?: number
  lng?: number
  status: 'submitted' | 'approved' | 'rejected'
  approval_note?: string
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
  address?: Address
  items?: PickupItemWithMaterial[]
  photos?: PickupPhoto[]
  payment?: Payment
}

export interface PickupItemWithMaterial extends PickupItem {
  material?: Material
}

export interface ProfileWithAddresses extends Profile {
  addresses?: Address[]
}
