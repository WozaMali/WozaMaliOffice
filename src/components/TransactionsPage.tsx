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
  getAllPointsTransactions,
  getAllMonetaryTransactions,
  deletePointsTransaction,
  deleteMonetaryTransaction,
  deleteMultiplePointsTransactions,
  deleteMultipleMonetaryTransactions,
  deleteAllTransactions,
  PointsTransaction,
  MonetaryTransaction
} from '@/lib/transactionsService';
import { DeleteTransactionsDialog } from './DeleteTransactionsDialog';

export default function TransactionsPage() {
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [monetaryTransactions, setMonetaryTransactions] = useState<MonetaryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedPointsTransactions, setSelectedPointsTransactions] = useState<string[]>([]);
  const [selectedMonetaryTransactions, setSelectedMonetaryTransactions] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'single-points' | 'single-monetary' | 'bulk-points' | 'bulk-monetary' | 'all';
    transactionId?: string;
  }>({ isOpen: false, type: 'single-points' });

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const [pointsResult, monetaryResult] = await Promise.all([
        getAllPointsTransactions(),
        getAllMonetaryTransactions()
      ]);

      if (pointsResult.error) {
        console.error('Error loading points transactions:', pointsResult.error);
      } else {
        setPointsTransactions(pointsResult.data || []);
      }

      if (monetaryResult.error) {
        console.error('Error loading monetary transactions:', monetaryResult.error);
      } else {
        setMonetaryTransactions(monetaryResult.data || []);
      }

    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePointsTransaction = (transactionId: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single-points',
      transactionId
    });
  };

  const handleDeleteMonetaryTransaction = (transactionId: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'single-monetary',
      transactionId
    });
  };

  const handleBulkDeletePointsTransactions = () => {
    if (selectedPointsTransactions.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'bulk-points'
    });
  };

  const handleBulkDeleteMonetaryTransactions = () => {
    if (selectedMonetaryTransactions.length === 0) return;
    setDeleteDialog({
      isOpen: true,
      type: 'bulk-monetary'
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
        case 'single-points':
          if (!transactionId) return;
          result = await deletePointsTransaction(transactionId);
          if (result.success) {
            setPointsTransactions(prev => prev.filter(t => t.id !== transactionId));
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'single-monetary':
          if (!transactionId) return;
          result = await deleteMonetaryTransaction(transactionId);
          if (result.success) {
            setMonetaryTransactions(prev => prev.filter(t => t.id !== transactionId));
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'bulk-points':
          result = await deleteMultiplePointsTransactions(selectedPointsTransactions);
          if (result.success) {
            setPointsTransactions(prev => prev.filter(t => !selectedPointsTransactions.includes(t.id)));
            setSelectedPointsTransactions([]);
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'bulk-monetary':
          result = await deleteMultipleMonetaryTransactions(selectedMonetaryTransactions);
          if (result.success) {
            setMonetaryTransactions(prev => prev.filter(t => !selectedMonetaryTransactions.includes(t.id)));
            setSelectedMonetaryTransactions([]);
            setNotice({ type: 'success', message: result.message });
          } else {
            setNotice({ type: 'error', message: result.message });
          }
          break;
          
        case 'all':
          result = await deleteAllTransactions();
          if (result.success) {
            setPointsTransactions([]);
            setMonetaryTransactions([]);
            setSelectedPointsTransactions([]);
            setSelectedMonetaryTransactions([]);
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
      case 'single-points':
        return {
          title: 'Delete Points Transaction',
          description: 'Are you sure you want to delete this points transaction?',
          transactionCount: 1,
          isDangerous: false,
          requireConfirmation: false
        };
        
      case 'single-monetary':
        return {
          title: 'Delete Monetary Transaction',
          description: 'Are you sure you want to delete this monetary transaction?',
          transactionCount: 1,
          isDangerous: false,
          requireConfirmation: false
        };
        
      case 'bulk-points':
        return {
          title: 'Delete Points Transactions',
          description: `Are you sure you want to delete ${selectedPointsTransactions.length} points transactions?`,
          transactionCount: selectedPointsTransactions.length,
          isDangerous: true,
          requireConfirmation: true,
          confirmationText: 'DELETE'
        };
        
      case 'bulk-monetary':
        return {
          title: 'Delete Monetary Transactions',
          description: `Are you sure you want to delete ${selectedMonetaryTransactions.length} monetary transactions?`,
          transactionCount: selectedMonetaryTransactions.length,
          isDangerous: true,
          requireConfirmation: true,
          confirmationText: 'DELETE'
        };
        
      case 'all':
        return {
          title: 'Delete ALL Transactions',
          description: 'This will permanently delete ALL transactions in the system. This action cannot be undone.',
          transactionCount: pointsTransactions.length + monetaryTransactions.length,
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

      {/* Points Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Points Transactions ({pointsTransactions.length})
              </CardTitle>
              <CardDescription>Points-based transactions</CardDescription>
            </div>
            {selectedPointsTransactions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeletePointsTransactions}
                disabled={deleting === 'bulk-points'}
                className="flex items-center gap-2"
              >
                {deleting === 'bulk-points' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedPointsTransactions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pointsTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No points transactions found
            </div>
          ) : (
            <div className="space-y-2">
              {pointsTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPointsTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPointsTransactions(prev => [...prev, transaction.id]);
                        } else {
                          setSelectedPointsTransactions(prev => prev.filter(id => id !== transaction.id));
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
                        {transaction.description} • {transaction.source || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePointsTransaction(transaction.id)}
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

      {/* Monetary Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Monetary Transactions ({monetaryTransactions.length})
              </CardTitle>
              <CardDescription>Monetary transactions</CardDescription>
            </div>
            {selectedMonetaryTransactions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteMonetaryTransactions}
                disabled={deleting === 'bulk-monetary'}
                className="flex items-center gap-2"
              >
                {deleting === 'bulk-monetary' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedMonetaryTransactions.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {monetaryTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No monetary transactions found
            </div>
          ) : (
            <div className="space-y-2">
              {monetaryTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMonetaryTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMonetaryTransactions(prev => [...prev, transaction.id]);
                        } else {
                          setSelectedMonetaryTransactions(prev => prev.filter(id => id !== transaction.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{transaction.type}</Badge>
                        <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                        <span className="text-gray-500">{transaction.reference || 'No reference'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaction.description || 'No description'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMonetaryTransaction(transaction.id)}
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
        onClose={() => setDeleteDialog({ isOpen: false, type: 'single-points' })}
        onConfirm={handleConfirmDelete}
        {...getDialogConfig()}
      />
    </div>
  );
}
