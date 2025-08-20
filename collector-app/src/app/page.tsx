"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  MapPin, 
  Plus, 
  History, 
  BarChart3,
  LogOut,
  Target,
  Zap,
  Users,
  Package,
  Clock,
  DollarSign,
  Leaf,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Loader2,
  Camera,
  Upload
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { PickupService, type CreatePickupData } from "@/lib/pickup-service";
import type { CollectorDashboardView, Material } from "@/lib/supabase";
import { toast } from "sonner";

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real data from Supabase
  const [pickups, setPickups] = useState<CollectorDashboardView[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalKg: 0,
    totalPoints: 0,
    totalEarnings: 0,
    monthlyCollections: 0,
    monthlyKg: 0,
    monthlyPoints: 0,
    monthlyEarnings: 0,
  });

  const [isNewPickupOpen, setIsNewPickupOpen] = useState(false);
  const [newPickupForm, setNewPickupForm] = useState({
    customerId: '',
    addressId: '',
    notes: '',
    materials: [{ materialId: '', kg: 0, contamination: 0 }]
  });

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load pickups, customers, materials, and stats in parallel
      const [pickupsData, customersData, materialsData, statsData] = await Promise.all([
        PickupService.getCollectorPickups(user.id),
        PickupService.getCustomers(),
        PickupService.getMaterials(),
        PickupService.getCollectorStats(user.id)
      ]);

      setPickups(pickupsData);
      setCustomers(customersData);
      setMaterials(materialsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const addMaterialRow = () => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: [...prev.materials, { materialId: '', kg: 0, contamination: 0 }]
    }));
  };

  const removeMaterialRow = (index: number) => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialRow = (index: number, field: string, value: string | number) => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleCreatePickup = async () => {
    if (!user) return;

    try {
      const pickupData: CreatePickupData = {
        customer_id: newPickupForm.customerId,
        address_id: newPickupForm.addressId,
        notes: newPickupForm.notes,
        materials: newPickupForm.materials
          .filter(m => m.materialId && m.kg > 0)
          .map(m => ({
            material_id: m.materialId,
            kilograms: m.kg,
            contamination_pct: m.contamination,
          }))
      };

      const pickupId = await PickupService.createPickup(pickupData, user.id);
      
      if (pickupId) {
        toast.success('Pickup created successfully!');
        setIsNewPickupOpen(false);
        setNewPickupForm({
          customerId: '',
          addressId: '',
          notes: '',
          materials: [{ materialId: '', kg: 0, contamination: 0 }]
        });
        
        // Reload data
        await loadDashboardData();
      } else {
        toast.error('Failed to create pickup');
      }
    } catch (error) {
      console.error('Error creating pickup:', error);
      toast.error('Failed to create pickup');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading collector dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12">
                <img 
                  src={theme === 'dark' ? '/w white.png' : '/w yellow.png'} 
                  alt="Woza Mali Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Collector Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Target className="h-4 w-4 mr-1" />
                {user.role}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout()}
                className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pickups">Pickups</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCollections}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Kg Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalKg.toFixed(1)} kg</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R {stats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  This Month&apos;s Performance
                </CardTitle>
                <CardDescription>Your recycling achievements for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.monthlyCollections}</div>
                    <p className="text-sm text-muted-foreground">Collections</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.monthlyKg.toFixed(1)} kg</div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.monthlyPoints.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Points</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">R {stats.monthlyEarnings.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">Earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks for collectors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Dialog open={isNewPickupOpen} onOpenChange={setIsNewPickupOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                        <Plus className="h-6 w-6" />
                        <span>New Pickup</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Pickup</DialogTitle>
                        <DialogDescription>
                          Record a new recycling collection from a customer
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Customer Selection */}
                        <div>
                          <Label htmlFor="customer">Customer</Label>
                          <Select value={newPickupForm.customerId} onValueChange={(value) => setNewPickupForm(prev => ({ ...prev, customerId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.first_name} {customer.last_name} ({customer.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Address Selection */}
                        <div>
                          <Label htmlFor="address">Pickup Address</Label>
                          <Select 
                            value={newPickupForm.addressId} 
                            onValueChange={(value) => setNewPickupForm(prev => ({ ...prev, addressId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select address" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers
                                .find(c => c.id === newPickupForm.customerId)?.addresses?.map(address => (
                                  <SelectItem key={address.id} value={address.id}>
                                    {address.line1}, {address.suburb}, {address.city}
                                  </SelectItem>
                                )) || []}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            placeholder="Any special instructions or notes about this pickup..."
                            value={newPickupForm.notes}
                            onChange={(e) => setNewPickupForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>

                        {/* Materials */}
                        <div>
                          <Label>Materials Collected</Label>
                          <div className="space-y-3">
                            {newPickupForm.materials.map((material, index) => (
                              <div key={index} className="grid grid-cols-4 gap-2 items-end">
                                <div>
                                  <Label>Material</Label>
                                  <Select 
                                    value={material.materialId} 
                                    onValueChange={(value) => updateMaterialRow(index, 'materialId', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {materials.map(mat => (
                                        <SelectItem key={mat.id} value={mat.id}>
                                          {mat.name} (R{mat.rate_per_kg}/kg)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Weight (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={material.kg}
                                    onChange={(e) => updateMaterialRow(index, 'kg', parseFloat(e.target.value) || 0)}
                                    placeholder="0.0"
                                  />
                                </div>
                                <div>
                                  <Label>Contamination (%)</Label>
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={material.contamination}
                                    onChange={(e) => updateMaterialRow(index, 'contamination', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMaterialRow(index)}
                                    disabled={newPickupForm.materials.length === 1}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addMaterialRow}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Material
                            </Button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button 
                          onClick={handleCreatePickup}
                          disabled={!newPickupForm.customerId || !newPickupForm.addressId}
                          className="w-full"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Create Pickup
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                    <Camera className="h-6 w-6" />
                    <span>Take Photo</span>
                  </Button>
                  
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                    <History className="h-6 w-6" />
                    <span>History</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest pickup activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pickups.slice(0, 5).map((pickup) => (
                    <div key={pickup.pickup_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{pickup.customer_name || 'Unknown Customer'}</p>
                          <p className="text-sm text-muted-foreground">
                            {pickup.total_kg} kg • {pickup.total_points} points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(pickup.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(pickup.started_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pickups Tab */}
          <TabsContent value="pickups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Pickups</CardTitle>
                <CardDescription>View and manage all your recycling collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pickups.map((pickup) => (
                    <div key={pickup.pickup_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{pickup.customer_name || 'Unknown Customer'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pickup.line1}, {pickup.suburb}, {pickup.city}
                          </p>
                        </div>
                        {getStatusBadge(pickup.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Weight:</span>
                          <p className="font-medium">{pickup.total_kg} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p className="font-medium">R {pickup.total_value.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Points:</span>
                          <p className="font-medium">{pickup.total_points}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{new Date(pickup.started_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Directory</CardTitle>
                <CardDescription>Manage your customer relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{customer.first_name} {customer.last_name}</h3>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      {customer.addresses && customer.addresses.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <p>Addresses: {customer.addresses.length}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Detailed insights into your recycling impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Environmental Impact</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>CO2 Saved:</span>
                        <span className="font-medium">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.co2_saved || 0), 0).toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Water Saved:</span>
                        <span className="font-medium">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.water_saved || 0), 0).toFixed(2)} L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Landfill Saved:</span>
                        <span className="font-medium">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.landfill_saved || 0), 0).toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Earnings:</span>
                        <span className="font-medium">R {stats.totalEarnings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Average:</span>
                        <span className="font-medium">R {(stats.totalEarnings / Math.max(stats.totalCollections, 1)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Points:</span>
                        <span className="font-medium">{stats.totalPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}