"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { 
  Truck, 
  Recycle, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Activity,
  Package,
  DollarSign,
  TrendingUp,
  Navigation,
  Phone,
  Mail,
  Loader2
} from "lucide-react";

export default function CollectorPage() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [collectorStats, setCollectorStats] = useState({
    totalCollections: 0,
    totalKgCollected: 0,
    totalEarnings: 0,
    averageRating: 0,
    activePickups: 0,
    completedToday: 0,
    monthlyGoal: 80,
    monthlyProgress: 0
  });
  const [activePickups, setActivePickups] = useState<any[]>([]);
  const [recentCollections, setRecentCollections] = useState<any[]>([]);

  // Load real data from Supabase
  useEffect(() => {
    if (user) {
      loadCollectorData();
    }
  }, [user]);

  const loadCollectorData = async () => {
    try {
      setIsLoading(true);
      
      // Get collector's pickups
      const { data: pickups, error } = await supabase
        .from('pickups')
        .select(`
          *,
          customer:profiles!pickups_customer_id_fkey(first_name, last_name, email, phone),
          address:addresses(line1, suburb, city)
        `)
        .eq('collector_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickups:', error);
        return;
      }

      // Transform pickups data
      const transformedPickups = (pickups || []).map(pickup => {
        const customer = pickup.customer as any;
        const address = pickup.address as any;
        
        return {
          id: pickup.id,
          customer: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Unknown Customer',
          address: address ? `${address.line1}, ${address.suburb}, ${address.city}` : 'No address',
          phone: customer?.phone || 'No phone',
          email: customer?.email || 'No email',
          status: pickup.status,
          scheduledTime: new Date(pickup.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          estimatedKg: pickup.total_kg || 0,
          materials: ['Paper', 'Plastic', 'Glass'], // TODO: Get from pickup_items
          notes: pickup.approval_note || 'No notes'
        };
      });

      setActivePickups(transformedPickups.filter(p => p.status === 'submitted' || p.status === 'in_progress'));
      // Transform recent collections to match the expected structure
      const recentCollectionsData = transformedPickups
        .filter(p => p.status === 'approved' || p.status === 'completed')
        .slice(0, 5)
        .map(pickup => ({
          id: pickup.id,
          customer: pickup.customer,
          address: pickup.address,
          kg: pickup.estimatedKg,
          earnings: (pickup.estimatedKg || 0) * 5, // R5 per kg
          rating: 5, // TODO: Implement rating system
          date: pickup.created_at || pickup.submitted_at
        }));
      
      setRecentCollections(recentCollectionsData);

      // Calculate real statistics
      const totalCollections = transformedPickups.filter(p => p.status === 'approved' || p.status === 'completed').length;
      const totalKgCollected = transformedPickups
        .filter(p => p.status === 'approved' || p.status === 'completed')
        .reduce((sum, p) => sum + (p.estimatedKg || 0), 0);
      const totalEarnings = totalKgCollected * 5; // R5 per kg
      
      // Calculate today's collections
      const today = new Date().toDateString();
      const completedToday = transformedPickups.filter(p => 
        (p.status === 'approved' || p.status === 'completed') && 
        new Date(p.created_at).toDateString() === today
      ).length;

      // Calculate monthly progress
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyCollections = transformedPickups.filter(p => {
        const pickupDate = new Date(p.created_at);
        return (p.status === 'approved' || p.status === 'completed') &&
               pickupDate.getMonth() === currentMonth &&
               pickupDate.getFullYear() === currentYear;
      });
      const monthlyProgress = monthlyCollections.length;

      setCollectorStats({
        totalCollections,
        totalKgCollected,
        totalEarnings,
        averageRating: 4.8, // TODO: Implement rating system
        activePickups: transformedPickups.filter(p => p.status === 'submitted' || p.status === 'in_progress').length,
        completedToday,
        monthlyGoal: 80,
        monthlyProgress
      });

    } catch (error) {
      console.error('Error loading collector data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'scheduled':
        return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const getRatingStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Collector Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.full_name || 'Collector'}! Ready to make a difference today?</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Status: Active & Available
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
          <Button 
            onClick={loadCollectorData} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collections
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Recycle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
                            <div className="text-2xl font-bold text-foreground mb-1">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(collectorStats.totalCollections)}
                </div>
            <p className="text-xs text-muted-foreground">
              Collections completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KG Collected
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Package className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
                            <div className="text-2xl font-bold text-foreground mb-1">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatWeight(collectorStats.totalKgCollected)}
                </div>
            <p className="text-xs text-muted-foreground">
              Waste diverted
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
                            <div className="text-2xl font-bold text-foreground mb-1">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(collectorStats.totalEarnings)}
                </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <TrendingUp className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : collectorStats.averageRating}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : getRatingStars(collectorStats.averageRating)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Pickups & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Active Pickups */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>Active Pickups ({isLoading ? '...' : collectorStats.activePickups})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activePickups.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active pickups at the moment</p>
                </div>
              ) : (
                activePickups.map((pickup) => (
                <div key={pickup.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {pickup.scheduledTime}
                      </span>
                    </div>
                    {getStatusBadge(pickup.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="font-medium mb-1">{pickup.customer}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{pickup.address}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <span>{pickup.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{pickup.email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">Estimated KG</p>
                        <p className="font-medium">{pickup.estimatedKg} kg</p>
                      </div>
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">Materials</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {pickup.materials.map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {pickup.notes && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-xs">{pickup.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start">
              <Truck className="h-4 w-4 mr-2" />
              Start Collection
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              View Route
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Recycle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Today's Progress</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium">{isLoading ? '...' : collectorStats.completedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal:</span>
                  <span className="font-medium">{isLoading ? '...' : collectorStats.monthlyProgress}/{collectorStats.monthlyGoal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${isLoading ? 0 : (collectorStats.monthlyProgress / collectorStats.monthlyGoal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Collections */}
      <Card className="shadow-elegant mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Recycle className="h-5 w-5 text-primary" />
            <span>Recent Collections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentCollections.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Recycle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent collections yet</p>
              </div>
            ) : (
              recentCollections.map((collection) => (
              <div key={collection.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(collection.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {getRatingStars(collection.rating)}
                    </span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completed
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{collection.customer}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-sm">{collection.address}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">KG Collected</p>
                    <p className="font-medium">{collection.kg}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="font-medium">{formatCurrency(collection.earnings)}</p>
                  </div>
                </div>
              </div>
              ))}
            </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Efficiency</h3>
              <p className="text-sm text-muted-foreground">95% on-time completion</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Quality</h3>
              <p className="text-sm text-muted-foreground">98% customer satisfaction</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-1">Growth</h3>
              <p className="text-sm text-muted-foreground">+15% monthly increase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
