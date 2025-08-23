"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Recycle, 
  Leaf, 
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface CustomerPickup {
  id: string;
  status: 'submitted' | 'approved' | 'rejected';
  started_at: string;
  submitted_at?: string;
  total_kg?: number;
  total_value?: number;
  address: {
    line1: string;
    suburb: string;
    city: string;
  };
  items: Array<{
    material_name: string;
    kilograms: number;
    rate_per_kg: number;
    value: number;
  }>;
  environmental_impact: {
    co2_saved: number;
    water_saved: number;
    landfill_saved: number;
    trees_equivalent: number;
  };
}

interface CustomerStats {
  total_pickups: number;
  total_kg_recycled: number;
  total_value_earned: number;
  total_co2_saved: number;
  total_water_saved: number;
  total_trees_equivalent: number;
  pending_pickups: number;
  approved_pickups: number;
  rejected_pickups: number;
}

export function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [pickups, setPickups] = useState<CustomerPickup[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (user && profile) {
      fetchCustomerData();
      setupRealtimeSubscriptions();
    }
  }, [user, profile]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to customer's pickup changes
    const pickupsSubscription = supabase
      .channel('customer_pickups_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pickups',
          filter: `customer_id=eq.${user?.id}`
        }, 
        (payload) => {
          console.log('Customer pickup change detected:', payload);
          fetchCustomerData(); // Refresh data when pickups change
        }
      )
      .subscribe();

    return () => pickupsSubscription.unsubscribe();
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo("Fetching customer data...");

      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      // Fetch customer's pickups with full details
      const { data: pickupsData, error: pickupsError } = await supabase
        .from('pickups')
        .select(`
          *,
          address:addresses(line1, suburb, city),
          items:pickup_items(
            kilograms,
            material:materials(name, rate_per_kg)
          )
        `)
        .eq('customer_id', user.id)
        .order('started_at', { ascending: false });

      if (pickupsError) {
        setDebugInfo(`Pickups error: ${pickupsError.message}`);
        throw pickupsError;
      }

      // Process pickups data
      const processedPickups: CustomerPickup[] = (pickupsData || []).map(pickup => {
        const items = (pickup.items || []).map((item: any) => ({
          material_name: item.material?.name || 'Unknown',
          kilograms: item.kilograms || 0,
          rate_per_kg: item.material?.rate_per_kg || 0,
          value: (item.kilograms || 0) * (item.material?.rate_per_kg || 0)
        }));

        // Calculate environmental impact
        const totalKg = items.reduce((sum, item) => sum + item.kilograms, 0);
        const environmental_impact = {
          co2_saved: totalKg * 2.5, // Approximate CO2 saved per kg
          water_saved: totalKg * 25, // Approximate water saved per kg
          landfill_saved: totalKg * 0.8, // Approximate landfill saved per kg
          trees_equivalent: (totalKg * 2.5) / 22 // 22 kg CO2 = 1 tree
        };

        return {
          id: pickup.id,
          status: pickup.status,
          started_at: pickup.started_at,
          submitted_at: pickup.submitted_at,
          total_kg: pickup.total_kg,
          total_value: pickup.total_value,
          address: pickup.address || { line1: '', suburb: '', city: '' },
          items,
          environmental_impact
        };
      });

      setPickups(processedPickups);

      // Calculate customer statistics
      const customerStats: CustomerStats = {
        total_pickups: processedPickups.length,
        total_kg_recycled: processedPickups.reduce((sum, p) => sum + (p.total_kg || 0), 0),
        total_value_earned: processedPickups.reduce((sum, p) => sum + (p.total_value || 0), 0),
        total_co2_saved: processedPickups.reduce((sum, p) => sum + p.environmental_impact.co2_saved, 0),
        total_water_saved: processedPickups.reduce((sum, p) => sum + p.environmental_impact.water_saved, 0),
        total_trees_equivalent: processedPickups.reduce((sum, p) => sum + p.environmental_impact.trees_equivalent, 0),
        pending_pickups: processedPickups.filter(p => p.status === 'submitted').length,
        approved_pickups: processedPickups.filter(p => p.status === 'approved').length,
        rejected_pickups: processedPickups.filter(p => p.status === 'rejected').length
      };

      setStats(customerStats);
      setDebugInfo(`Data loaded successfully. Pickups: ${customerStats.total_pickups}, KG: ${customerStats.total_kg_recycled.toFixed(1)}`);

    } catch (err: any) {
      console.error("Error fetching customer data:", err);
      setError(err.message || "Error loading customer data");
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
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your recycling data...</span>
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
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCustomerData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Your recycling data is not available at the moment.</p>
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
                <span className="text-sm font-medium">Debug Info:</span>
                <span className="text-sm">{debugInfo}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchCustomerData}
                className="text-blue-600 hover:text-blue-800"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name || 'Recycler'}! 🌱
            </h1>
            <p className="text-muted-foreground">
              Keep up the great work! Every item you recycle makes a difference.
            </p>
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
              {formatNumber(stats.total_pickups)}
            </div>
            <p className="text-xs text-muted-foreground">
              Collections completed
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
              {formatWeight(stats.total_kg_recycled)}
            </div>
            <p className="text-xs text-muted-foreground">
              Waste diverted
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(stats.total_value_earned)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money earned
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CO₂ Saved
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <TrendingUp className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatNumber(stats.total_co2_saved)} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Carbon footprint reduced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental Impact */}
        <Card className="lg:col-span-1 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span>Environmental Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Water Saved</span>
                <span className="text-sm font-medium">{formatNumber(stats.total_water_saved)}L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Landfill Saved</span>
                <span className="text-sm font-medium">{formatNumber(stats.total_landfill_saved)} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trees Equivalent</span>
                <span className="text-sm font-medium">{formatNumber(stats.total_trees_equivalent)}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-center">
                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Recycling Champion!</p>
                <p className="text-xs text-muted-foreground">
                  You've saved {formatNumber(stats.total_co2_saved)} kg of CO₂
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Collections */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Recycle className="h-5 w-5 text-primary" />
              <span>Recent Collections</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pickups.length === 0 ? (
              <div className="text-center py-8">
                <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your recycling journey by scheduling your first pickup!
                </p>
                <Button>Schedule Pickup</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pickups.slice(0, 5).map((pickup) => (
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
                        <p className="text-xs text-muted-foreground">Total KG</p>
                        <p className="font-medium">{formatWeight(pickup.total_kg)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-medium">{formatCurrency(pickup.total_value)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                        <p className="font-medium">{formatNumber(pickup.environmental_impact.co2_saved)} kg</p>
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

                    {/* Material Breakdown */}
                    {pickup.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Materials:</p>
                        <div className="flex flex-wrap gap-2">
                          {pickup.items.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item.material_name}: {item.kilograms}kg
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {pickups.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      View All {pickups.length} Collections
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <Recycle className="h-6 w-6" />
              <span>Schedule New Pickup</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Leaf className="h-6 w-6" />
              <span>View Impact Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Award className="h-6 w-6" />
              <span>Redeem Rewards</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
