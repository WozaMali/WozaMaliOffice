import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Recycle, 
  Calendar, 
  MapPin, 
  Package,
  Search,
  Filter,
  Plus,
  Check,
  X,
  Eye,
  Loader2,
  DollarSign,
  Scale,
  Leaf,
  Users,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  getAllCollections, 
  getPendingCollections, 
  getApprovedCollections,
  updateCollectionStatus,
  getCollectionStats,
  getGreenScholarFundSummary,
  type CollectionWithDetails,
  type CollectionStats,
  type GreenScholarFundSummary
} from "../lib/office-collection-services";

export default function AdminCollections() {
  const [collections, setCollections] = useState<CollectionWithDetails[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithDetails[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [greenScholarFund, setGreenScholarFund] = useState<GreenScholarFundSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [collections, searchTerm, statusFilter]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const [collectionsData, statsData, fundData] = await Promise.all([
        getAllCollections(),
        getCollectionStats(),
        getGreenScholarFundSummary()
      ]);
      
      setCollections(collectionsData);
      setStats(statsData);
      setGreenScholarFund(fundData);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = collections;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(collection => collection.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(collection => 
        collection.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.collector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.area_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCollections(filtered);
  };

  const handleStatusUpdate = async (collectionId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdatingStatus(collectionId);
      await updateCollectionStatus(collectionId, newStatus);
      await loadCollections(); // Reload data
    } catch (error) {
      console.error('Error updating collection status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge variant="default" className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading collections...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collections Management</h1>
            <p className="text-gray-600">Manage waste collections from collectors</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_collections}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pending_collections} pending, {stats.approved_collections} approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_weight_kg.toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {stats.avg_weight_per_collection.toFixed(1)} kg per collection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_estimated_value)}</div>
                <p className="text-xs text-muted-foreground">
                  From approved collections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Green Scholar Fund</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_green_scholar_fund)}</div>
                <p className="text-xs text-muted-foreground">
                  From PET bottle collections
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by resident, collector, material, or area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections List */}
        <div className="space-y-4">
          {filteredCollections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No collections found</h3>
                <p className="text-gray-500 text-center">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Collections will appear here when collectors submit them'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCollections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{collection.resident_name}</h3>
                        {getStatusBadge(collection.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{collection.area_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Collector: {collection.collector_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{collection.material_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-gray-400" />
                          <span>{collection.weight_kg} kg</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>{formatCurrency(collection.estimated_value)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(collection.created_at)}</span>
                        </div>
                      </div>

                      {collection.contributes_to_green_scholar_fund && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <Leaf className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Green Scholar Fund: {formatCurrency(collection.green_scholar_fund_amount)}
                          </span>
                        </div>
                      )}

                      {collection.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {collection.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {collection.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(collection.id, 'approved')}
                            disabled={updatingStatus === collection.id}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {updatingStatus === collection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(collection.id, 'rejected')}
                            disabled={updatingStatus === collection.id}
                          >
                            {updatingStatus === collection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {collection.photo_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(collection.photo_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          View Photos
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}