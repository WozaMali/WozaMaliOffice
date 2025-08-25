'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  Scale,
  DollarSign,
  Calendar,
  User,
  Truck
} from 'lucide-react';
import { getPickups, subscribeToPickups, updatePickupStatus, formatDate, formatCurrency, formatWeight } from '@/lib/admin-services';
import { Pickup } from '@/lib/supabase';

export default function PickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [approvalNote, setApprovalNote] = useState('');

  // Load pickups and set up real-time subscription
  useEffect(() => {
    loadPickups();
    
    // Subscribe to real-time changes
    const subscription = subscribeToPickups((payload) => {
      if (payload.eventType === 'INSERT') {
        setPickups(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setPickups(prev => prev.map(pickup => 
          pickup.id === payload.new.id ? payload.new : pickup
        ));
      } else if (payload.eventType === 'DELETE') {
        setPickups(prev => prev.filter(pickup => pickup.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter pickups based on search and filters
  useEffect(() => {
    let filtered = pickups;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pickup =>
        pickup.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.collector?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.address?.line1?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === statusFilter);
    }

    setFilteredPickups(filtered);
  }, [pickups, searchTerm, statusFilter]);

  const loadPickups = async () => {
    try {
      setLoading(true);
      const data = await getPickups();
      setPickups(data);
    } catch (error) {
      console.error('Error loading pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId: string, newStatus: string) => {
    try {
      await updatePickupStatus(pickupId, newStatus, approvalNote);
      setSelectedPickup(null);
      setApprovalNote('');
      // Real-time update will handle the UI update
    } catch (error) {
      console.error('Error updating pickup status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'submitted':
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
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pickup Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all pickup requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickups.length}</div>
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
            <div className="text-2xl font-bold">
              {pickups.filter(p => p.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWeight(pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Recycled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pickups.reduce((sum, p) => sum + (p.total_value || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pickups..."
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
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pickups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pickups ({filteredPickups.length})</CardTitle>
          <CardDescription>
            Review and manage pickup requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Collector</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Weight</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPickups.map((pickup) => (
                  <tr key={pickup.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {pickup.customer?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pickup.customer?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {pickup.collector?.full_name || 'Unassigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pickup.collector?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div className="text-sm">
                          {pickup.address?.line1}, {pickup.address?.suburb}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {formatWeight(pickup.total_kg || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {formatCurrency(pickup.total_value || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadge(pickup.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(pickup.status)}
                          {pickup.status}
                        </div>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(pickup.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPickup(pickup)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {pickup.status === 'submitted' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleStatusUpdate(pickup.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleStatusUpdate(pickup.id, 'rejected')}
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

      {/* Approval Modal */}
      {selectedPickup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Pickup Details</h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <span className="font-medium">Customer:</span> {selectedPickup.customer?.full_name}
              </div>
              <div>
                <span className="font-medium">Weight:</span> {formatWeight(selectedPickup.total_kg || 0)}
              </div>
              <div>
                <span className="font-medium">Value:</span> {formatCurrency(selectedPickup.total_value || 0)}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge className={`ml-2 ${getStatusBadge(selectedPickup.status)}`}>
                  {selectedPickup.status}
                </Badge>
              </div>
            </div>

            {selectedPickup.status === 'submitted' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Approval Note (Optional)</label>
                <Textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note about this pickup..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPickup(null);
                  setApprovalNote('');
                }}
              >
                Close
              </Button>
              {selectedPickup.status === 'submitted' && (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate(selectedPickup.id, 'approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate(selectedPickup.id, 'rejected')}
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
