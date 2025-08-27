"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  Recycle, 
  DollarSign, 
  TrendingUp,
  Calendar,
  MapPin,
  Package,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

// Real pickup interface
interface Pickup {
  id: string;
  customer_id: string;
  collector_id: string;
  address_id: string;
  started_at: string;
  submitted_at: string;
  status: 'submitted' | 'approved' | 'rejected';
  approval_note?: string;
  customer_name?: string;
  collector_name?: string;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  total_kg?: number;
  total_value?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPickups: 0,
    totalKgRecycled: 0,
    totalValue: 0,
    pendingPickups: 0,
    activeCollectors: 0,
    monthlyGrowth: 0,
    systemHealth: 'excellent'
  });

  // Check authentication and role
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!user) {
      router.push('/admin-login');
      return;
    }
    
    if (!profile || profile.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    
    // User is authenticated and has proper role, load data
    loadPickupData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (user && profile?.role === 'admin') {
        loadPickupData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, profile, authLoading, router]);

  const loadPickupData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pickups with simple queries
      const { data: pickupsData, error } = await supabase
        .from('pickups')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickups:', error);
        return;
      }

      // Fetch customer profiles separately
      const customerIds = Array.from(new Set(pickupsData?.map(p => p.customer_id).filter(Boolean) || []));
      const { data: customerProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', customerIds);

      // Fetch collector profiles separately
      const collectorIds = Array.from(new Set(pickupsData?.map(p => p.collector_id).filter(Boolean) || []));
      const { data: collectorProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', collectorIds);

      // Fetch addresses separately
      const addressIds = Array.from(new Set(pickupsData?.map(p => p.address_id).filter(Boolean) || []));
      const { data: addresses } = await supabase
        .from('addresses')
        .select('id, line1, suburb, city')
        .in('id', addressIds);

      // Transform the data using the fetched profiles and addresses
      const transformedPickups: Pickup[] = (pickupsData || []).map(pickup => {
        // Find customer profile
        const customer = customerProfiles?.find(p => p.id === pickup.customer_id);
        // Find collector profile
        const collector = collectorProfiles?.find(p => p.id === pickup.collector_id);
        // Find address
        const address = addresses?.find(a => a.id === pickup.address_id);
        
        // Use pickup's own total_kg and total_value
        const totalKg = pickup.total_kg || 0;
        const totalValue = pickup.total_value || 0;

        return {
          id: pickup.id,
          customer_id: pickup.customer_id,
          collector_id: pickup.collector_id,
          address_id: pickup.address_id,
          started_at: pickup.started_at,
          submitted_at: pickup.submitted_at,
          status: pickup.status,
          approval_note: pickup.approval_note,
          customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Unknown Customer',
          collector_name: collector ? `${collector.first_name || ''} ${collector.last_name || ''}`.trim() : 'Unknown Collector',
          address_line1: address?.line1 || 'No address',
          address_suburb: address?.suburb || '',
          address_city: address?.city || '',
          total_kg: totalKg,
          total_value: totalValue
        };
      });

      setPickups(transformedPickups);
      
      // Calculate stats
      const totalPickups = transformedPickups.length;
      const totalKgRecycled = transformedPickups.reduce((sum, p) => sum + (p.total_kg || 0), 0);
      const totalValue = transformedPickups.reduce((sum, p) => sum + (p.total_value || 0), 0);
      const pendingPickups = transformedPickups.filter(p => p.status === 'submitted').length;
      
      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeCollectors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'collector');

      // Calculate monthly growth from historical data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Get pickups from previous month for comparison
      const { data: previousMonthPickups } = await supabase
        .from('pickups')
        .select('total_kg, total_value')
        .gte('submitted_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
        .lt('submitted_at', new Date(currentYear, currentMonth, 1).toISOString());

      const previousMonthTotal = previousMonthPickups?.reduce((sum, p) => sum + (p.total_kg || 0), 0) || 0;
      const monthlyGrowth = previousMonthTotal > 0 
        ? Math.round(((totalKgRecycled - previousMonthTotal) / previousMonthTotal) * 100)
        : 0;

      // Calculate system health based on data
      let systemHealth = 'excellent';
      if (totalPickups === 0) {
        systemHealth = 'no-data';
      } else if (pendingPickups > totalPickups * 0.3) {
        systemHealth = 'attention';
      } else if (pendingPickups > totalPickups * 0.1) {
        systemHealth = 'good';
      }

             setStats({
         totalUsers: totalUsers || 0,
         totalPickups,
         totalKgRecycled,
         totalValue,
         pendingPickups,
         activeCollectors: activeCollectors || 0,
         monthlyGrowth,
         systemHealth
       });
       
       // Update last updated timestamp
       setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading pickup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePickup = async (pickupId: string) => {
    try {
      console.log('🔍 Attempting to approve pickup:', pickupId);
      
      // Use the database function to update pickup status
      const { data: updateResult, error } = await supabase
        .rpc('update_pickup_status', {
          pickup_id: pickupId,
          new_status: 'approved',
          note: `Approved by admin on ${new Date().toLocaleString()}`
        });

      if (error) {
        console.error('❌ Error updating pickup:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        alert(`Error approving pickup: ${error.message}`);
        return;
      }

      console.log('✅ Pickup updated successfully:', updateResult);

      // Reload data
      await loadPickupData();
      alert('Pickup approved successfully!');
    } catch (error) {
      console.error('❌ Unexpected error approving pickup:', error);
      alert('Unexpected error approving pickup. Please try again.');
    }
  };

  const handleRejectPickup = async (pickupId: string) => {
    try {
      console.log('🔍 Attempting to reject pickup:', pickupId);
      
      // Use the database function to update pickup status
      const { data: updateResult, error } = await supabase
        .rpc('update_pickup_status', {
          pickup_id: pickupId,
          new_status: 'rejected',
          note: `Rejected by admin on ${new Date().toLocaleString()}`
        });

      if (error) {
        console.error('❌ Error updating pickup:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        alert(`Error rejecting pickup: ${error.message}`);
        return;
      }

      console.log('✅ Pickup updated successfully:', updateResult);

      // Reload data
      await loadPickupData();
      alert('Pickup rejected successfully!');
    } catch (error) {
      console.error('❌ Unexpected error rejecting pickup:', error);
      alert('Unexpected error rejecting pickup. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="default" className="bg-red-500"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSystemHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent':
        return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
      case 'good':
        return <Badge variant="default" className="bg-blue-500">Good</Badge>;
      case 'attention':
        return <Badge variant="default" className="bg-yellow-500">Attention</Badge>;
      case 'no-data':
        return <Badge variant="default" className="bg-gray-500">No Data</Badge>;
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 Testing database connection...');
      
      // Test 1: Check if we can read from pickups table
      const { data: readTest, error: readError } = await supabase
        .from('pickups')
        .select('id, status')
        .limit(1);
      
      if (readError) {
        console.error('❌ Read test failed:', readError);
        alert(`Read test failed: ${readError.message}`);
        return;
      }
      
      console.log('✅ Read test passed:', readTest);
      
      // Test 2: Check if we can update a pickup (find one with 'submitted' status)
      const { data: submittedPickup, error: findError } = await supabase
        .from('pickups')
        .select('id, status')
        .eq('status', 'submitted')
        .limit(1)
        .single();
      
      if (findError) {
        console.error('❌ No submitted pickups found:', findError);
        alert('No submitted pickups found to test with');
        return;
      }
      
      console.log('📋 Found pickup to test:', submittedPickup);
      
      // Test 3: Try to update the pickup status
      const { data: updateTest, error: updateError } = await supabase
        .from('pickups')
        .update({ 
          status: 'test_approved',
          approval_note: 'Test update by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', submittedPickup.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update test failed:', updateError);
        alert(`Update test failed: ${updateError.message}`);
        return;
      }
      
      console.log('✅ Update test passed:', updateTest);
      
      // Test 4: Revert the test update
      const { error: revertError } = await supabase
        .from('pickups')
        .update({ 
          status: 'submitted',
          approval_note: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submittedPickup.id);
      
      if (revertError) {
        console.error('❌ Revert test failed:', revertError);
        alert(`Revert test failed: ${revertError.message}`);
        return;
      }
      
      console.log('✅ Revert test passed');
      alert('✅ All database tests passed! Your admin permissions are working correctly.');
      
      // Reload data to show the test results
      await loadPickupData();
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      alert(`Database test failed: ${error}`);
    }
  };

  const getSystemHealthMessage = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'All systems operational';
      case 'good':
        return 'System running smoothly';
      case 'attention':
        return 'Some pickups pending review';
      case 'no-data':
        return 'No activity recorded yet';
      default:
        return 'System status unknown';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  const formatWeight = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)} tons`;
    return `${num.toFixed(1)} kg`;
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking role
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to Woza Mali Admin Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {profile.role}
            </Badge>
                         {getSystemHealthBadge(stats.systemHealth)}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">
            Logged in as: {profile.full_name || profile.email}
          </span>
                     <span className="text-sm text-muted-foreground">
             Last updated: {lastUpdated.toLocaleString()}
           </span>
                     <div className="flex items-center gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               onClick={loadPickupData}
               disabled={isLoading}
             >
               {isLoading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <BarChart3 className="h-4 w-4" />
               )}
               Refresh Data
             </Button>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={testDatabaseConnection}
               disabled={isLoading}
             >
               🧪 Test DB
             </Button>
           </div>
             <div className="flex items-center gap-1 text-xs text-muted-foreground">
               <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
               <span>{isLoading ? 'Updating...' : 'Live'}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatNumber(stats.totalUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pickups
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Recycle className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatNumber(stats.totalPickups)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPickups} pending
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KG Recycled
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Package className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatWeight(stats.totalKgRecycled)}
            </div>
            <p className="text-xs text-muted-foreground">
              Waste diverted
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <DollarSign className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Pickups */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Recycle className="h-5 w-5 text-primary" />
              <span>Recent Pickups</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and approve submitted pickups from collectors. Submitted pickups require admin approval.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {pickups.map((pickup) => (
                  <div key={pickup.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(pickup.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {getStatusBadge(pickup.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-medium">{pickup.customer_name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">KG</p>
                        <p className="font-medium">{pickup.total_kg}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-medium">{formatCurrency(pickup.total_value || 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{pickup.status.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{pickup.address_line1}, {pickup.address_suburb}, {pickup.address_city}</span>
                    </div>

                    {pickup.status === 'submitted' && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprovePickup(pickup.id)}
                          className="flex items-center"
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectPickup(pickup.id)}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Recycle className="h-4 w-4 mr-2" />
              View Pickups
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                stats.systemHealth === 'excellent' ? 'bg-green-100' :
                stats.systemHealth === 'good' ? 'bg-blue-100' :
                stats.systemHealth === 'attention' ? 'bg-yellow-100' :
                'bg-gray-100'
              }`}>
                {stats.systemHealth === 'excellent' ? <CheckCircle className="h-8 w-8 text-green-600" /> :
                 stats.systemHealth === 'good' ? <Activity className="h-8 w-8 text-blue-600" /> :
                 stats.systemHealth === 'attention' ? <AlertCircle className="h-8 w-8 text-yellow-600" /> :
                 <Clock className="h-8 w-8 text-gray-600" />}
              </div>
              <h3 className="font-semibold mb-1">System Health</h3>
              <p className="text-sm text-muted-foreground">{getSystemHealthMessage(stats.systemHealth)}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Active Collectors</h3>
              <p className="text-sm text-muted-foreground">{stats.activeCollectors} online</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-1">Growth Rate</h3>
              <p className="text-sm text-muted-foreground">+{stats.monthlyGrowth}% monthly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
