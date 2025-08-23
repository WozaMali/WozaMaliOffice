"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Recycle, 
  Users, 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Leaf,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Database,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  unifiedDataService, 
  UnifiedPickup, 
  UnifiedCustomer, 
  UnifiedCollector, 
  UnifiedSystemStats 
} from "@/lib/unified-data-service";
import { supabase } from "@/lib/supabase";

interface UnifiedDashboardProps {
  role: 'ADMIN' | 'COLLECTOR';
}

export function UnifiedDashboard({ role }: UnifiedDashboardProps) {
  const { user, profile } = useAuth();
  const [pickups, setPickups] = useState<UnifiedPickup[]>([]);
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [collectors, setCollectors] = useState<UnifiedCollector[]>([]);
  const [systemStats, setSystemStats] = useState<UnifiedSystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Debug logging
  useEffect(() => {
    console.log('UnifiedDashboard mounted with role:', role);
    console.log('Current user:', user);
    console.log('Current profile:', profile);
  }, [role, user, profile]);

  useEffect(() => {
    console.log('useEffect triggered - user:', user?.id, 'profile:', profile?.id);
    if (user && profile) {
      console.log('User and profile found, fetching data...');
      fetchUnifiedData();
      const cleanup = setupUnifiedRealtime();
      return cleanup;
    } else {
      console.log('User or profile not found, setting loading to false');
      setLoading(false);
    }
  }, [user, profile]);

  const setupUnifiedRealtime = () => {
    console.log('Setting up realtime subscriptions...');
    const cleanup = unifiedDataService.setupUnifiedRealtimeSubscriptions({
      onPickupChange: (payload) => {
        console.log('Unified pickup change detected:', payload);
        fetchUnifiedData(); // Refresh data when pickups change
      },
      onCustomerChange: (payload) => {
        console.log('Unified customer change detected:', payload);
        fetchUnifiedData(); // Refresh data when customers change
      },
      onCollectorChange: (payload) => {
        console.log('Unified collector change detected:', payload);
        fetchUnifiedData(); // Refresh data when collectors change
      },
      onSystemChange: (payload) => {
        console.log('Unified system change detected:', payload);
        fetchUnifiedData(); // Refresh data when system changes
      }
    });

    return cleanup;
  };

  const fetchUnifiedData = async () => {
    try {
      console.log('Starting to fetch unified data...');
      setLoading(true);
      setError(null);
      setDebugInfo("Fetching unified data...");

      // Fetch data based on role
      const [pickupsResult, customersResult, collectorsResult, statsResult] = await Promise.all([
        unifiedDataService.getUnifiedPickups({
          limit: 50,
          ...(role === 'COLLECTOR' && { collector_id: user?.id })
        }),
        unifiedDataService.getUnifiedCustomers({ limit: 50 }),
        unifiedDataService.getUnifiedCollectors({ limit: 50 }),
        unifiedDataService.getUnifiedSystemStats()
      ]);

      console.log('Data fetch results:', {
        pickups: pickupsResult,
        customers: customersResult,
        collectors: collectorsResult,
        stats: statsResult
      });

      if (pickupsResult.error) throw pickupsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (collectorsResult.error) throw collectorsResult.error;
      if (statsResult.error) throw statsResult.error;

      setPickups(pickupsResult.data);
      setCustomers(customersResult.data);
      setCollectors(collectorsResult.data);
      setSystemStats(statsResult.data);

      setDebugInfo(`Unified data loaded successfully. Pickups: ${pickupsResult.data.length}, Customers: ${customersResult.data.length}, Collectors: ${collectorsResult.data.length}`);

    } catch (err: any) {
      console.error("Error fetching unified data:", err);
      setError(err.message || "Error loading unified data");
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number | null) => {
    if (num === null || num === undefined) return "R 0";
    return `R ${num.toLocaleString()}`;
  };

  const formatWeight = (num: number | null) => {
    if (num === null || num === undefined) return "0 kg";
    if (num >= 1000) return `${(num / 1000).toFixed(1)} tons`;
    return `${num.toFixed(1)} kg`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500 flex items-center gap-1"><Activity className="h-3 w-3" /> In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading unified dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchUnifiedData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!systemStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Data Unavailable</h3>
            <p className="text-muted-foreground">Unable to load unified system data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {debugInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Unified Dashboard Status:</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDebugInfo("")}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear
              </Button>
            </div>
            <p className="text-sm text-blue-600 mt-2">{debugInfo}</p>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-yellow-700">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Debug Information</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchUnifiedData}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.from('profiles').select('count').limit(1);
                    if (error) {
                      setDebugInfo(`Supabase test failed: ${error.message}`);
                    } else {
                      setDebugInfo(`Supabase test successful: ${JSON.stringify(data)}`);
                    }
                  } catch (err: any) {
                    setDebugInfo(`Supabase test error: ${err.message}`);
                  }
                }}
                className="text-yellow-600 hover:text-yellow-800"
              >
                Test Connection
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-yellow-700">Authentication:</p>
              <p>User: {user ? `${user.email} (${user.id})` : 'Not authenticated'}</p>
              <p>Profile: {profile ? `${profile.full_name} (${profile.role})` : 'No profile'}</p>
              <p>Role: {role}</p>
            </div>
            <div>
              <p className="font-medium text-yellow-700">Data Status:</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Error: {error || 'None'}</p>
              <p>Pickups: {pickups.length}</p>
              <p>Customers: {customers.length}</p>
              <p>Collectors: {collectors.length}</p>
            </div>
            <div>
              <p className="font-medium text-yellow-700">System Stats:</p>
              <p>Available: {systemStats ? 'Yes' : 'No'}</p>
              {systemStats && (
                <>
                  <p>Total Users: {systemStats.total_users}</p>
                  <p>Total Pickups: {systemStats.total_pickups}</p>
                  <p>System Health: {systemStats.system_health}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {role === 'ADMIN' ? 'Admin' : 'Collector'} Dashboard 🔗
            </h1>
            <p className="text-muted-foreground">
              Unified view of system data - shared information between admin and collector roles
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Real-time data sync</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pickups
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Recycle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatNumber(systemStats.total_pickups)}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.pending_pickups} pending
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total KG Recycled
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Leaf className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatWeight(systemStats.total_kg_recycled)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatWeight(systemStats.average_pickup_weight)} avg
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(systemStats.total_value_generated)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(systemStats.average_pickup_value)} avg
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Health
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <Activity className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <Badge 
                variant={systemStats.system_health === 'excellent' ? 'default' : 
                        systemStats.system_health === 'good' ? 'default' : 
                        systemStats.system_health === 'warning' ? 'secondary' : 'destructive'}
                className={`${
                  systemStats.system_health === 'excellent' ? 'bg-green-500' :
                  systemStats.system_health === 'good' ? 'bg-blue-500' :
                  systemStats.system_health === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              >
                {systemStats.system_health.charAt(0).toUpperCase() + systemStats.system_health.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.active_collectors} collectors active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different data views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pickups">Pickups</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="collectors">Collectors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pickup Status Breakdown */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Recycle className="h-5 w-5 text-primary" />
                  <span>Pickup Status Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-medium text-warning">{formatNumber(systemStats.pending_pickups)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-sm font-medium text-blue-500">{formatNumber(systemStats.approved_pickups)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-sm font-medium text-blue-600">{formatNumber(systemStats.in_progress_pickups)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium text-success">{formatNumber(systemStats.completed_pickups)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rejected</span>
                  <span className="text-sm font-medium text-destructive">{formatNumber(systemStats.rejected_pickups)}</span>
                </div>
              </CardContent>
            </Card>

            {/* User Breakdown */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-success" />
                  <span>User Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customers</span>
                  <span className="text-sm font-medium">{formatNumber(systemStats.customers_count)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Collectors</span>
                  <span className="text-sm font-medium">{formatNumber(systemStats.collectors_count)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Admins & Staff</span>
                  <span className="text-sm font-medium">{formatNumber(systemStats.admins_count)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="text-sm font-medium">{formatNumber(systemStats.total_users)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pickups Tab */}
        <TabsContent value="pickups" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Recycle className="h-5 w-5 text-primary" />
                <span>Recent Pickups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pickups.length === 0 ? (
                <div className="text-center py-8">
                  <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pickups Yet</h3>
                  <p className="text-muted-foreground">No pickup data available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pickups.slice(0, 10).map((pickup) => (
                    <div key={pickup.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {new Date(pickup.started_at).toLocaleDateString()}
                          </span>
                        </div>
                        {getStatusBadge(pickup.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="font-medium">{pickup.customer.full_name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Total KG</p>
                          <p className="font-medium">{formatWeight(pickup.total_kg || null)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Value</p>
                          <p className="font-medium">{formatCurrency(pickup.total_value || null)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Items</p>
                          <p className="font-medium">{pickup.items.length}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{pickup.address.line1}, {pickup.address.suburb}, {pickup.address.city}</span>
                      </div>
                    </div>
                  ))}
                  
                  {pickups.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        View All {pickups.length} Pickups
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-success" />
                <span>Customer Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Customers Yet</h3>
                  <p className="text-muted-foreground">No customer data available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.slice(0, 10).map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{customer.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Pickups</p>
                          <p className="font-medium">{formatNumber(customer.total_pickups)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">KG Recycled</p>
                          <p className="font-medium">{formatWeight(customer.total_kg_recycled)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Value Earned</p>
                          <p className="font-medium">{formatCurrency(customer.total_value_earned)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                          <p className="font-medium">{formatNumber(customer.total_co2_saved)} kg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {customers.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        View All {customers.length} Customers
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collectors Tab */}
        <TabsContent value="collectors" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-warning" />
                <span>Collector Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collectors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collectors Yet</h3>
                  <p className="text-muted-foreground">No collector data available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collectors.slice(0, 10).map((collector) => (
                    <div key={collector.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{collector.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{collector.email}</p>
                        </div>
                        <Badge variant={collector.is_available ? 'default' : 'secondary'}>
                          {collector.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Assigned</p>
                          <p className="font-medium">{formatNumber(collector.total_pickups_assigned)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="font-medium">{formatNumber(collector.total_pickups_completed)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">KG Collected</p>
                          <p className="font-medium">{formatWeight(collector.total_kg_collected)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Value Generated</p>
                          <p className="font-medium">{formatCurrency(collector.total_value_generated)}</p>
                        </div>
                      </div>

                      {collector.active_pickups.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Active Pickups:</p>
                          <div className="space-y-1">
                            {collector.active_pickups.slice(0, 3).map((pickup) => (
                              <div key={pickup.id} className="text-xs text-muted-foreground">
                                • {pickup.customer_name} - {pickup.address}
                              </div>
                            ))}
                            {collector.active_pickups.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{collector.active_pickups.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {collectors.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        View All {collectors.length} Collectors
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Status */}
      <Card className="shadow-elegant">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Real-time connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3" />
              <span>{systemStats.realtime_connections} active connections</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-3 w-3" />
              <span>Last sync: {new Date(systemStats.last_sync).toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
