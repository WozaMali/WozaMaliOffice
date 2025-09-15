'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  User,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  getWithdrawals, 
  subscribeToWithdrawals, 
  updateWithdrawalStatusOffice, 
  formatDate, 
  formatCurrency,
  getWithdrawalsFallbackFromCollections
} from '@/lib/admin-services';

export default function PaymentsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'wallet' | 'cash' | 'bank_transfer' | 'mobile_money'>('wallet');

  // Load withdrawals and set up real-time subscription
  useEffect(() => {
    loadWithdrawals();
    
    // Subscribe to real-time changes
    const subscription = subscribeToWithdrawals((payload) => {
      console.log('🔔 Real-time withdrawal update:', payload);
      if (payload.eventType === 'INSERT') {
        console.log('➕ New withdrawal inserted:', payload.new);
        setWithdrawals(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        console.log('🔄 Withdrawal updated:', payload.new);
        setWithdrawals(prev => prev.map(row => 
          row.id === payload.new.id ? payload.new : row
        ));
      } else if (payload.eventType === 'DELETE') {
        console.log('🗑️ Withdrawal deleted:', payload.old);
        setWithdrawals(prev => prev.filter(row => row.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter withdrawals based on search and filters
  useEffect(() => {
    let filtered = withdrawals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        row.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(row => row.status === statusFilter);
    }

    setFilteredWithdrawals(filtered);
  }, [withdrawals, searchTerm, statusFilter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading withdrawals with status filter:', statusFilter);
      let data = await getWithdrawals(statusFilter);
      if (!data || data.length === 0) {
        console.log('⚠️ No withdrawals rows returned; falling back to unified_collections...');
        let collectionId: string | undefined = undefined;
        try {
          const params = new URLSearchParams(window.location.search);
          const cid = params.get('collection_id');
          if (cid) collectionId = cid;
        } catch {}
        data = await getWithdrawalsFallbackFromCollections({ collectionId, limit: 200 });
      }
      console.log('📊 Loaded withdrawals:', data);
      setWithdrawals(data);
    } catch (error) {
      console.error('❌ Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (withdrawalId: string, newStatus: string) => {
    try {
      await updateWithdrawalStatusOffice(withdrawalId, newStatus as any, adminNotes, payoutMethod);
      setSelectedPayment(null);
      setAdminNotes('');
      // Real-time update will handle the UI update
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMethodBadge = (method: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (method) {
      case 'wallet':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'bank_transfer':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'cash':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'mobile_money':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPending = withdrawals.filter(p => p.status === 'pending').length;
  const totalApproved = withdrawals.filter(p => p.status === 'approved').length;
  const totalAmount = withdrawals.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = withdrawals.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">Manage withdrawals and payment processing</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawals.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {withdrawals.filter(w => w.status === 'rejected' || w.status === 'cancelled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Declined requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Amount</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(withdrawals.filter(w => w.status === 'rejected' || w.status === 'cancelled').reduce((sum, w) => sum + (w.amount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-white" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Withdrawals ({filteredWithdrawals.length})</CardTitle>
          <CardDescription className="text-white">
            Review and process payment requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-white">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-orange-500 transition-colors duration-200 group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-white group-hover:text-gray-900" />
                        <div>
                          <div className="font-medium text-white group-hover:text-gray-900">
                            {row.owner_name || row.user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-white group-hover:text-gray-700">
                            {row.user?.email || row.user_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white group-hover:text-gray-900">
                          {formatCurrency(row.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={getMethodBadge(row.payout_method || 'bank_transfer')}>
                        {row.payout_method || 'bank_transfer'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(row.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(row.status)}
                          {row.status}
                        </div>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-white group-hover:text-gray-700">
                      {row.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-white group-hover:text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white group-hover:text-gray-900" />
                        {formatDate(row.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(row)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {row.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(row.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleStatusUpdate(row.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Withdrawal Details</h3>
            
            <div className="space-y-3 mb-4 text-gray-800">
              <div>
                <span className="font-medium">User:</span> {selectedPayment.user?.full_name || selectedPayment.owner_name}
              </div>
              <div>
                <span className="font-medium">Email/ID:</span> {selectedPayment.user?.email || selectedPayment.user_id || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Amount:</span> {formatCurrency(selectedPayment.amount)}
              </div>
              <div>
                <span className="font-medium">Bank:</span> {selectedPayment.bank_name}
              </div>
              <div>
                <span className="font-medium">Account Number:</span> {selectedPayment.account_number}
              </div>
              <div>
                <span className="font-medium">Account Type:</span> {selectedPayment.account_type}
              </div>
              <div>
                <span className="font-medium">Branch Code:</span> {selectedPayment.branch_code}
              </div>
              <div>
                <span className="font-medium">Payout Method:</span> {selectedPayment.payout_method || 'bank_transfer'}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge className={`ml-2 ${getStatusBadge(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatDate(selectedPayment.created_at)}
              </div>
              {selectedPayment.notes && (
                <div>
                  <span className="font-medium">Notes:</span> {selectedPayment.notes}
                </div>
              )}
              <div>
                <span className="font-medium">Reference:</span> 
                <div className="text-xs text-gray-600 mt-1 break-all">{selectedPayment.id}</div>
              </div>
            </div>

            {selectedPayment.status === 'pending' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-800">Admin Notes (Optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={3}
                />
              </div>
            )}

            {selectedPayment.status === 'pending' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-800">Payout Method</label>
                <Select value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet (deduct balance)</SelectItem>
                    <SelectItem value="cash">Cash Payout</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPayment(null);
                  setAdminNotes('');
                }}
              >
                Close
              </Button>
              {selectedPayment.status === 'pending' && (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate(selectedPayment.id, 'approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate(selectedPayment.id, 'rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
