import { supabase } from './supabase';

export interface GreenScholarFundData {
  totalBalance: number;
  petDonations: number;
  directDonations: number;
  expenses: number;
  recentTransactions: GreenScholarTransaction[];
  schools: School[];
  childHomes: ChildHome[];
  monthlyStats: MonthlyStats[];
}

export interface GreenScholarTransaction {
  id: string;
  transaction_type: string;
  source_type: string;
  amount: number;
  description: string;
  donor_name: string;
  donor_email: string;
  beneficiary_type: string;
  beneficiary_name: string;
  status: string;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  school_code: string;
  city: string;
  province: string;
  student_count: number;
  school_type: string;
  is_active: boolean;
}

export interface ChildHome {
  id: string;
  name: string;
  home_code: string;
  city: string;
  province: string;
  children_count: number;
  age_range: string;
  is_active: boolean;
}

export interface MonthlyStats {
  month: string;
  pet_donations: number;
  direct_donations: number;
  expenses: number;
  net_balance: number;
}

export class GreenScholarServices {
  /**
   * Load Green Scholar Fund data for admin dashboard
   */
  static async getFundData(): Promise<GreenScholarFundData> {
    try {
      // Load fund balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('green_scholar_fund_balance')
        .select('*')
        .single();

      if (balanceError) throw balanceError;

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('green_scholar_transactions')
        .select(`
          *,
          schools(name),
          child_headed_homes(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      // Load schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (schoolsError) throw schoolsError;

      // Load child-headed homes
      const { data: childHomesData, error: childHomesError } = await supabase
        .from('child_headed_homes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (childHomesError) throw childHomesError;

      // Load monthly stats
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_green_scholar_monthly_stats');

      // Transform transactions data
      const transformedTransactions = transactionsData?.map(transaction => ({
        ...transaction,
        beneficiary_name: transaction.beneficiary_type === 'school' 
          ? transaction.schools?.name 
          : transaction.beneficiary_type === 'child_home'
          ? transaction.child_headed_homes?.name
          : 'General Fund'
      })) || [];

      return {
        totalBalance: balanceData?.total_balance || 0,
        petDonations: balanceData?.pet_donations_total || 0,
        directDonations: balanceData?.direct_donations_total || 0,
        expenses: balanceData?.expenses_total || 0,
        recentTransactions: transformedTransactions,
        schools: schoolsData || [],
        childHomes: childHomesData || [],
        monthlyStats: monthlyData || []
      };

    } catch (error) {
      console.error('Error loading Green Scholar Fund data:', error);
      throw new Error('Failed to load Green Scholar Fund data');
    }
  }

  /**
   * Process PET donation from a collection
   */
  static async processPetDonationFromCollection(
    collectionId: string,
    materialName: string,
    weightKg: number,
    ratePerKg: number,
    donorName: string,
    donorEmail: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('process_pet_donation_from_collection', {
          p_collection_id: collectionId,
          p_material_name: materialName,
          p_weight_kg: weightKg,
          p_rate_per_kg: ratePerKg,
          p_donor_name: donorName,
          p_donor_email: donorEmail
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error processing PET donation:', error);
      throw new Error('Failed to process PET donation');
    }
  }

  /**
   * Create a direct donation
   */
  static async createDirectDonation(
    userId: string,
    amount: number,
    beneficiaryType: 'school' | 'child_home' | 'general_fund',
    beneficiaryId?: string,
    donorMessage?: string,
    isAnonymous: boolean = false
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_direct_donation', {
          p_user_id: userId,
          p_amount: amount,
          p_beneficiary_type: beneficiaryType,
          p_beneficiary_id: beneficiaryId || null,
          p_donor_message: donorMessage || null,
          p_is_anonymous: isAnonymous
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating direct donation:', error);
      throw new Error('Failed to create donation');
    }
  }

  /**
   * Get schools for donation form
   */
  static async getSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading schools:', error);
      throw new Error('Failed to load schools');
    }
  }

  /**
   * Get child-headed homes for donation form
   */
  static async getChildHomes(): Promise<ChildHome[]> {
    try {
      const { data, error } = await supabase
        .from('child_headed_homes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading child homes:', error);
      throw new Error('Failed to load child homes');
    }
  }

  /**
   * Get fund allocation for a collection
   */
  static async getCollectionFundAllocation(collectionId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_collection_fund_allocation', {
          p_collection_id: collectionId
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading collection fund allocation:', error);
      throw new Error('Failed to load fund allocation');
    }
  }

  /**
   * Get beneficiary statistics
   */
  static async getBeneficiaryStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_beneficiary_stats');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading beneficiary stats:', error);
      throw new Error('Failed to load beneficiary statistics');
    }
  }

  /**
   * Add a new school
   */
  static async addSchool(schoolData: Partial<School>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([schoolData])
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error adding school:', error);
      throw new Error('Failed to add school');
    }
  }

  /**
   * Add a new child-headed home
   */
  static async addChildHome(homeData: Partial<ChildHome>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('child_headed_homes')
        .insert([homeData])
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error adding child home:', error);
      throw new Error('Failed to add child home');
    }
  }

  /**
   * Update school information
   */
  static async updateSchool(schoolId: string, updates: Partial<School>): Promise<void> {
    try {
      const { error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', schoolId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating school:', error);
      throw new Error('Failed to update school');
    }
  }

  /**
   * Update child-headed home information
   */
  static async updateChildHome(homeId: string, updates: Partial<ChildHome>): Promise<void> {
    try {
      const { error } = await supabase
        .from('child_headed_homes')
        .update(updates)
        .eq('id', homeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating child home:', error);
      throw new Error('Failed to update child home');
    }
  }
}
