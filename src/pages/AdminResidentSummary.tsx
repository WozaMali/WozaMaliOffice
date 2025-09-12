import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
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
  TrendingUp,
  Calendar,
  User,
  Truck,
  Banknote
} from 'lucide-react';
import { getPickups, subscribeToPickups, updatePickupStatus, formatDate, formatCurrency, formatWeight, TransformedPickup } from '@/lib/admin-services';

export default function AdminResidentSummary() {
  const [pickups, setPickups] = useState<TransformedPickup[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<TransformedPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState<TransformedPickup | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  // Safe date getter across possible schemas
  const getPickupDate = (p: TransformedPickup) => {
    const anyP = p as any;
    return anyP.approved_at || anyP.updated_at || anyP.created_at || '';
  };
  const [residentAggregates, setResidentAggregates] = useState<Record<string, {
    resident_name: string;
    resident_email?: string;
    total_weight: number;
    total_value: number;
    pickups_count: number;
  }>>({});

  useEffect(() => {
    loadPickups();
    const watchdog = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    const subscription = subscribeToPickups((payload) => {
      if (payload.eventType === 'INSERT') {
        setPickups(prev => [payload.new as TransformedPickup, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setPickups(prev => prev.map(pickup => pickup.id === payload.new.id ? (payload.new as TransformedPickup) : pickup));
      } else if (payload.eventType === 'DELETE') {
        setPickups(prev => prev.filter(pickup => pickup.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []);

  useEffect(() => {
    let filtered = pickups;
    if (searchTerm) {
      filtered = filtered.filter(pickup =>
        pickup.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.collector?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.address?.line1?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === statusFilter);
    }
    setFilteredPickups(filtered);
    // Build aggregated totals per resident based on current filtered list
    const agg: Record<string, {
      resident_name: string;
      resident_email?: string;
      total_weight: number;
      total_value: number;
      pickups_count: number;
    }> = {};
    for (const p of filtered) {
      const id = String((p as any).user_id || (p as any).customer_id || p.customer?.email || 'unknown');
      if (!agg[id]) {
        agg[id] = {
          resident_name: p.customer?.full_name || 'Unknown',
          resident_email: p.customer?.email,
          total_weight: 0,
          total_value: 0,
          pickups_count: 0,
        };
      }
      agg[id].total_weight += Number(p.total_kg || 0);
      agg[id].total_value += Number(p.total_value || 0);
      agg[id].pickups_count += 1;
    }
    setResidentAggregates(agg);
  }, [pickups, searchTerm, statusFilter]);

  const loadPickups = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getPickups();
      setPickups(data);
    } catch (error) {
      setLoadError((error as any)?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId: string, newStatus: 'submitted' | 'approved' | 'rejected') => {
    try {
      const result = await updatePickupStatus(pickupId, newStatus, approvalNote);
      if (result) {
        setPickups(prevPickups => prevPickups.map(pickup => pickup.id === pickupId ? ({ ...pickup, status: newStatus, admin_notes: approvalNote } as TransformedPickup) : pickup));
        setSelectedPickup(null);
        setApprovalNote('');
      }
    } catch (error) {
      // ignore
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
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
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
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Resident Summary</CardTitle>
              <CardDescription>We couldn't load data right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-600 mb-3">{loadError}</div>
              <Button onClick={loadPickups} variant="outline">Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resident Summary</h1>
            <p className="text-gray-600 mt-2">Manage and track resident-related collections</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pickups.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pickups.filter(p => p.status === 'submitted').length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0))}</div>
              <p className="text-xs text-muted-foreground">Recycled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pickups.reduce((sum, p) => sum + (p.total_value || 0), 0))}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>
        </div>

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
                  placeholder="Search residents or addresses..."
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

        <Card>
          <CardHeader>
            <CardTitle>Resident Summary ({filteredPickups.length})</CardTitle>
            <CardDescription>Review and manage resident-related collections</CardDescription>
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
                            <div className="font-medium text-gray-900">{pickup.customer?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{pickup.customer?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{pickup.collector?.full_name || 'Unassigned'}</div>
                            <div className="text-sm text-gray-500">{pickup.collector?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">{pickup.address?.line1}, {pickup.address?.suburb}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatWeight(pickup.total_kg || 0)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatCurrency(pickup.total_value || 0)}</span>
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
                          {formatDate(getPickupDate(pickup))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedPickup(pickup)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(pickup.status === 'submitted') && (
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

        {/* Aggregated totals per resident based on current filters */}
        <Card>
          <CardHeader>
            <CardTitle>Aggregated Totals per Resident ({Object.keys(residentAggregates).length})</CardTitle>
            <CardDescription>Summarized weight and value per resident for the filtered results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Resident</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pickups</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(residentAggregates).map(([id, row]) => (
                    <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{row.resident_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{row.resident_email || '—'}</td>
                      <td className="py-3 px-4">{row.pickups_count}</td>
                      <td className="py-3 px-4">{formatWeight(row.total_weight)}</td>
                      <td className="py-3 px-4">{formatCurrency(row.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedPickup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Resident Details</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Customer:</span>
                  <span className="text-gray-900">{selectedPickup.customer?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Collector:</span>
                  <span className="text-gray-900">{selectedPickup.collector?.full_name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="text-gray-900">{selectedPickup.address?.line1}, {selectedPickup.address?.suburb}, {selectedPickup.address?.city}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Weight:</span>
                  <span className="text-gray-900 font-semibold">{formatWeight(selectedPickup.total_kg || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Value:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(selectedPickup.total_value || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Status:</span>
                  <Badge className={`ml-2 ${getStatusBadge(selectedPickup.status)}`}>{selectedPickup.status}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="text-gray-900">{formatDate(getPickupDate(selectedPickup))}</span>
                </div>
              </div>

              {selectedPickup.status === 'submitted' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Approval Note (Optional)</label>
                  <Textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} placeholder="Add a note..." rows={3} className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPickup(null);
                    setApprovalNote('');
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
                {(selectedPickup.status === 'submitted') && (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(selectedPickup.id, 'approved')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusUpdate(selectedPickup.id, 'rejected')}>
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
    </AdminLayout>
  );
}
