/**
 * Transactions Management Service
 * Handles CRUD operations for wallet and regular transactions
 */

import { supabase } from './supabase';

export interface PointsTransaction {
  id: string;
  wallet_id: string;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'deduction' | 'transfer' | 'reset' | 'adjustment';
  points: number;
  balance_after: number;
  source?: string;
  reference_id?: string;
  description?: string;
  admin_notes?: string;
  created_at: string;
}

export interface MonetaryTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'adjustment';
  reference?: string;
  description?: string;
  created_at: string;
}

export interface DeleteTransactionResult {
  success: boolean;
  message: string;
  deletedCount?: number;
  error?: any;
}

/**
 * Get all points transactions
 */
export async function getAllPointsTransactions(): Promise<{ data: PointsTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select(`
        *,
        wallet:user_wallets(
          user_id,
          user:user_profiles(full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching points transactions:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAllPointsTransactions:', error);
    return { data: null, error };
  }
}

/**
 * Get all monetary transactions
 */
export async function getAllMonetaryTransactions(): Promise<{ data: MonetaryTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wallet:user_wallets(
          user_id,
          user:user_profiles(full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monetary transactions:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAllMonetaryTransactions:', error);
    return { data: null, error };
  }
}

/**
 * Delete a single points transaction
 */
export async function deletePointsTransaction(transactionId: string): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting points transaction:', transactionId);

    const { error } = await supabase
      .from('points_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting points transaction:', error);
      return {
        success: false,
        message: `Failed to delete points transaction: ${error.message}`,
        error
      };
    }

    console.log('✅ Points transaction deleted successfully');
    return {
      success: true,
      message: 'Points transaction deleted successfully',
      deletedCount: 1
    };

  } catch (error) {
    console.error('Exception in deletePointsTransaction:', error);
    return {
      success: false,
      message: 'Failed to delete points transaction',
      error
    };
  }
}

/**
 * Delete a single monetary transaction
 */
export async function deleteMonetaryTransaction(transactionId: string): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting monetary transaction:', transactionId);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting monetary transaction:', error);
      return {
        success: false,
        message: `Failed to delete monetary transaction: ${error.message}`,
        error
      };
    }

    console.log('✅ Monetary transaction deleted successfully');
    return {
      success: true,
      message: 'Monetary transaction deleted successfully',
      deletedCount: 1
    };

  } catch (error) {
    console.error('Exception in deleteMonetaryTransaction:', error);
    return {
      success: false,
      message: 'Failed to delete monetary transaction',
      error
    };
  }
}

/**
 * Delete multiple points transactions
 */
export async function deleteMultiplePointsTransactions(transactionIds: string[]): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting multiple points transactions:', transactionIds);

    const { error } = await supabase
      .from('points_transactions')
      .delete()
      .in('id', transactionIds);

    if (error) {
      console.error('Error deleting multiple points transactions:', error);
      return {
        success: false,
        message: `Failed to delete points transactions: ${error.message}`,
        error
      };
    }

    console.log('✅ Multiple points transactions deleted successfully');
    return {
      success: true,
      message: `${transactionIds.length} points transactions deleted successfully`,
      deletedCount: transactionIds.length
    };

  } catch (error) {
    console.error('Exception in deleteMultiplePointsTransactions:', error);
    return {
      success: false,
      message: 'Failed to delete points transactions',
      error
    };
  }
}

/**
 * Delete multiple monetary transactions
 */
export async function deleteMultipleMonetaryTransactions(transactionIds: string[]): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting multiple monetary transactions:', transactionIds);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', transactionIds);

    if (error) {
      console.error('Error deleting multiple monetary transactions:', error);
      return {
        success: false,
        message: `Failed to delete monetary transactions: ${error.message}`,
        error
      };
    }

    console.log('✅ Multiple monetary transactions deleted successfully');
    return {
      success: true,
      message: `${transactionIds.length} monetary transactions deleted successfully`,
      deletedCount: transactionIds.length
    };

  } catch (error) {
    console.error('Exception in deleteMultipleMonetaryTransactions:', error);
    return {
      success: false,
      message: 'Failed to delete monetary transactions',
      error
    };
  }
}

/**
 * Delete all transactions (use with caution!)
 */
export async function deleteAllTransactions(): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting ALL transactions (use with caution!)');

    // Delete points transactions
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (pointsError) {
      console.error('Error deleting all points transactions:', pointsError);
    }

    // Delete monetary transactions
    const { error: monetaryError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (monetaryError) {
      console.error('Error deleting all monetary transactions:', monetaryError);
    }

    if (pointsError || monetaryError) {
      return {
        success: false,
        message: 'Some transactions could not be deleted',
        error: { pointsError, monetaryError }
      };
    }

    console.log('✅ All transactions deleted successfully');
    return {
      success: true,
      message: 'All transactions deleted successfully',
      deletedCount: -1 // Unknown count
    };

  } catch (error) {
    console.error('Exception in deleteAllTransactions:', error);
    return {
      success: false,
      message: 'Failed to delete all transactions',
      error
    };
  }
}

/**
 * Delete transactions by source (e.g., collection ID)
 */
export async function deleteTransactionsBySource(sourceId: string): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting transactions by source:', sourceId);

    // Delete points transactions
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .delete()
      .eq('reference_id', sourceId);

    if (pointsError) {
      console.error('Error deleting points transactions by source:', pointsError);
    }

    // Delete monetary transactions
    const { error: monetaryError } = await supabase
      .from('transactions')
      .delete()
      .eq('reference', sourceId);

    if (monetaryError) {
      console.error('Error deleting monetary transactions by source:', monetaryError);
    }

    if (pointsError || monetaryError) {
      return {
        success: false,
        message: 'Some transactions could not be deleted',
        error: { pointsError, monetaryError }
      };
    }

    console.log('✅ Transactions deleted by source successfully');
    return {
      success: true,
      message: 'Transactions deleted by source successfully',
      deletedCount: -1 // Unknown count
    };

  } catch (error) {
    console.error('Exception in deleteTransactionsBySource:', error);
    return {
      success: false,
      message: 'Failed to delete transactions by source',
      error
    };
  }
}
