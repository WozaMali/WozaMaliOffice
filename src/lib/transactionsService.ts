/**
 * Transactions Management Service
 * Handles CRUD operations for wallet and regular transactions
 */

import { supabase } from './supabase';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: string;
  points: number;
  balance_after: number;
  source: string;
  source_id: string;
  source_type: string;
  description: string;
  created_at: string;
}

export interface RegularTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  reference: string;
  description: string;
  created_at: string;
}

export interface DeleteTransactionResult {
  success: boolean;
  message: string;
  deletedCount?: number;
  error?: any;
}

/**
 * Get all wallet transactions
 */
export async function getAllWalletTransactions(): Promise<{ data: WalletTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallet transactions:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAllWalletTransactions:', error);
    return { data: null, error };
  }
}

/**
 * Get all regular transactions
 */
export async function getAllRegularTransactions(): Promise<{ data: RegularTransaction[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching regular transactions:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception in getAllRegularTransactions:', error);
    return { data: null, error };
  }
}

/**
 * Delete a single wallet transaction
 */
export async function deleteWalletTransaction(transactionId: string): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting wallet transaction:', transactionId);

    const { error } = await supabase
      .from('wallet_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting wallet transaction:', error);
      return {
        success: false,
        message: `Failed to delete wallet transaction: ${error.message}`,
        error
      };
    }

    console.log('✅ Wallet transaction deleted successfully');
    return {
      success: true,
      message: 'Wallet transaction deleted successfully',
      deletedCount: 1
    };

  } catch (error) {
    console.error('Exception in deleteWalletTransaction:', error);
    return {
      success: false,
      message: 'Failed to delete wallet transaction',
      error
    };
  }
}

/**
 * Delete a single regular transaction
 */
export async function deleteRegularTransaction(transactionId: string): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting regular transaction:', transactionId);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting regular transaction:', error);
      return {
        success: false,
        message: `Failed to delete regular transaction: ${error.message}`,
        error
      };
    }

    console.log('✅ Regular transaction deleted successfully');
    return {
      success: true,
      message: 'Regular transaction deleted successfully',
      deletedCount: 1
    };

  } catch (error) {
    console.error('Exception in deleteRegularTransaction:', error);
    return {
      success: false,
      message: 'Failed to delete regular transaction',
      error
    };
  }
}

/**
 * Delete multiple wallet transactions
 */
export async function deleteMultipleWalletTransactions(transactionIds: string[]): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting multiple wallet transactions:', transactionIds);

    const { error } = await supabase
      .from('wallet_transactions')
      .delete()
      .in('id', transactionIds);

    if (error) {
      console.error('Error deleting multiple wallet transactions:', error);
      return {
        success: false,
        message: `Failed to delete wallet transactions: ${error.message}`,
        error
      };
    }

    console.log('✅ Multiple wallet transactions deleted successfully');
    return {
      success: true,
      message: `${transactionIds.length} wallet transactions deleted successfully`,
      deletedCount: transactionIds.length
    };

  } catch (error) {
    console.error('Exception in deleteMultipleWalletTransactions:', error);
    return {
      success: false,
      message: 'Failed to delete wallet transactions',
      error
    };
  }
}

/**
 * Delete multiple regular transactions
 */
export async function deleteMultipleRegularTransactions(transactionIds: string[]): Promise<DeleteTransactionResult> {
  try {
    console.log('🗑️ Deleting multiple regular transactions:', transactionIds);

    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', transactionIds);

    if (error) {
      console.error('Error deleting multiple regular transactions:', error);
      return {
        success: false,
        message: `Failed to delete regular transactions: ${error.message}`,
        error
      };
    }

    console.log('✅ Multiple regular transactions deleted successfully');
    return {
      success: true,
      message: `${transactionIds.length} regular transactions deleted successfully`,
      deletedCount: transactionIds.length
    };

  } catch (error) {
    console.error('Exception in deleteMultipleRegularTransactions:', error);
    return {
      success: false,
      message: 'Failed to delete regular transactions',
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

    // Delete wallet transactions
    const { error: walletError } = await supabase
      .from('wallet_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (walletError) {
      console.error('Error deleting all wallet transactions:', walletError);
    }

    // Delete regular transactions
    const { error: regularError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (regularError) {
      console.error('Error deleting all regular transactions:', regularError);
    }

    if (walletError || regularError) {
      return {
        success: false,
        message: 'Some transactions could not be deleted',
        error: { walletError, regularError }
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

    // Delete wallet transactions
    const { error: walletError } = await supabase
      .from('wallet_transactions')
      .delete()
      .eq('source_id', sourceId);

    if (walletError) {
      console.error('Error deleting wallet transactions by source:', walletError);
    }

    // Delete regular transactions
    const { error: regularError } = await supabase
      .from('transactions')
      .delete()
      .eq('source_id', sourceId);

    if (regularError) {
      console.error('Error deleting regular transactions by source:', regularError);
    }

    if (walletError || regularError) {
      return {
        success: false,
        message: 'Some transactions could not be deleted',
        error: { walletError, regularError }
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
