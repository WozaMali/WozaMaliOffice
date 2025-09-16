"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  AlertTriangle, 
  Wallet, 
  CreditCard, 
  Calendar,
  User,
  DollarSign,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  getAllWalletTransactions,
  getAllRegularTransactions,
  deleteWalletTransaction,
  deleteRegularTransaction,
  deleteMultipleWalletTransactions,
  deleteMultipleRegularTransactions,
  deleteAllTransactions,
  WalletTransaction,
  RegularTransaction
} from '@/lib/transactionsService';
import { DeleteTransactionsDialog } from './DeleteTransactionsDialog';

export default function TransactionsPage() {
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedWalletTransactions, setSelectedWalletTransactions] = useState<string[]>([]);
  const [selectedRegularTransactions, setSelectedRegularTransactions] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'single-wallet' | 'single-regular' | 'bulk-wallet' | 'bulk-regular' | 'all';
    transactionId?: string;
  }>({ isOpen: false, type: 'single-wallet' });

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const [walletResult, regularResult] = await Promise.all([
        getAllWalletTransactions(),
        getAllRegularTransactions()
      ]);

      if (walletResult.error) {
        console.error('Error loading wallet transactions:', walletResult.error);
      } else {
        setWalletTransactions(walletResult.data || []);
      }

      if (regularResult.error) {
        console.error('Error loading regular transactions:', regularResult.error);
      } else {
        setRegularTransactions(regularResult.data || []);
      }

    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWalletTransaction = (transactionId: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single-wallet',
      transactionId
    });
  };

  const handleDeleteRegularTransaction = (transactionId: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single-regular',
      transactionId
    });
  };

  const handleBulkDeleteWalletTransactions = () => {
    if (selectedWalletTransactions.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'bulk-wallet'
    });
  };

  const handleBulkDeleteRegularTransactions = () => {
    if (selectedRegularTransactions.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'bulk-regular'
    });
  };

  const handleDeleteAllTransactions = () => {
    setDeleteDialog({
      isOpen: true,
      type: 'all'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Handle actual deletion based on dialog type
  const handleConfirmDelete = async () => {
    const { type, transactionId } = deleteDialog;
    
    try {
      let result;
      
      switch (type) {
        case 'single-wallet':
          if (!transactionId) return;
          result = await deleteWalletTransaction(transactionId);
          if (result.success) {
            setWalletTransactions(prev => prev.filter(t => t.id !== transactionId));
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'single-regular':
          if (!transactionId) return;
          result = await deleteRegularTransaction(transactionId);
          if (result.success) {
            setRegularTransactions(prev => prev.filter(t => t.id !== transactionId));
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'bulk-wallet':
          result = await deleteMultipleWalletTransactions(selectedWalletTransactions);
          if (result.success) {
            setWalletTransactions(prev => prev.filter(t => !selectedWalletTransactions.includes(t.id)));
            setSelectedWalletTransactions([]);
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'bulk-regular':
          result = await deleteMultipleRegularTransactions(selectedRegularTransactions);
          if (result.success) {
            setRegularTransactions(prev => prev.filter(t => !selectedRegularTransactions.includes(t.id)));
            setSelectedRegularTransactions([]);
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'all':
          result = await deleteAllTransactions();
          if (result.success) {
            setWalletTransactions([]);
            setRegularTransactions([]);
            setSelectedWalletTransactions([]);
            setSelectedRegularTransactions([]);
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      setNotice({ type: 'error', message: 'Failed to delete transactions' });
    }
  };

  // Get dialog configuration based on type
  const getDialogConfig = () => {
    const { type, transactionId } = deleteDialog;
    
    switch (type) {
      case 'single-wallet':
        return {
          title: 'Delete Wallet Transaction',
          description: 'Are you sure you want to delete this wallet transaction?',
          transactionCount: 1,
          isDangerous: false,
          requireConfirmation: false
        };
        
      case 'single-regular':
        return {
          title: 'Delete Regular Transaction',
          description: 'Are you sure you want to delete this regular transaction?',
          transactionCount: 1,
          isDangerous: false,
          requireConfirmation: false
        };
        
      case 'bulk-wallet':
        return {
          title: 'Delete Wallet Transactions',
          description: `Are you sure you want to delete ${selectedWalletTransactions.length} wallet transactions?`,
          transactionCount: selectedWalletTransactions.length,
          isDangerous: true,
          requireConfirmation: true,
          confirmationText: 'DELETE'
        };
        
      case 'bulk-regular':
        return {
          title: 'Delete Regular Transactions',
          description: `Are you sure you want to delete ${selectedRegularTransactions.length} regular transactions?`,
          transactionCount: selectedRegularTransactions.length,
          isDangerous: true,
          requireConfirmation: true,
          confirmationText: 'DELETE'
        };
        
      case 'all':
        return {
          title: 'Delete ALL Transactions',
          description: 'This will permanently delete ALL transactions in the system. This action cannot be undone.',
          transactionCount: walletTransactions.length + regularTransactions.length,
          isDangerous: true,
          requireConfirmation: true,
          confirmationText: 'DELETE ALL'
        };
        
      default:
        return {
          title: 'Delete Transactions',
          description: 'Are you sure you want to delete these transactions?',
          transactionCount: 0,
          isDangerous: false,
          requireConfirmation: false
        };
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions Management</h1>
          <p className="text-gray-600">Manage wallet and regular transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadTransactions}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAllTransactions}
            disabled={deleting === 'all'}
            className="flex items-center gap-2"
          >
            {deleting === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete All
          </Button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <Alert className={notice.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {notice.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={notice.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notice.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Transactions ({walletTransactions.length})
              </CardTitle>
              <CardDescription>Points-based transactions</CardDescription>
            </div>
            {selectedWalletTransactions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteWalletTransactions}
                disabled={deleting === 'bulk-wallet'}
                className="flex items-center gap-2"
              >
                {deleting === 'bulk-wallet' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedWalletTransactions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {walletTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No wallet transactions found
            </div>
          ) : (
            <div className="space-y-2">
              {walletTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedWalletTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWalletTransactions(prev => [...prev, transaction.id]);
                        } else {
                          setSelectedWalletTransactions(prev => prev.filter(id => id !== transaction.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{transaction.transaction_type}</Badge>
                        <span className="font-medium">{transaction.points} points</span>
                        <span className="text-gray-500">→ {transaction.balance_after}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaction.description} • {transaction.source_type}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWalletTransaction(transaction.id)}
                    disabled={deleting === transaction.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleting === transaction.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Regular Transactions ({regularTransactions.length})
              </CardTitle>
              <CardDescription>Monetary transactions</CardDescription>
            </div>
            {selectedRegularTransactions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteRegularTransactions}
                disabled={deleting === 'bulk-regular'}
                className="flex items-center gap-2"
              >
                {deleting === 'bulk-regular' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedRegularTransactions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {regularTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No regular transactions found
            </div>
          ) : (
            <div className="space-y-2">
              {regularTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRegularTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRegularTransactions(prev => [...prev, transaction.id]);
                        } else {
                          setSelectedRegularTransactions(prev => prev.filter(id => id !== transaction.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{transaction.type}</Badge>
                        <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                        <span className="text-gray-500">{transaction.reference}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRegularTransaction(transaction.id)}
                    disabled={deleting === transaction.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleting === transaction.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteTransactionsDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: 'single-wallet' })}
        onConfirm={handleConfirmDelete}
        {...getDialogConfig()}
      />
    </div>
  );
}
