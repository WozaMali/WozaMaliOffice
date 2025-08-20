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
  Loader2
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

interface PickupData {
  id: string;
  customerName: string;
  customerEmail: string;
  address: string;
  status: string;
  totalKg: number;
  totalValue: number;
  totalPoints: number;
  date: string;
  materials: Array<{
    name: string;
    kg: number;
    value: number;
    points: number;
  }>;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for demonstration
  const [pickups, setPickups] = useState<PickupData[]>([
    {
      id: '1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      address: '123 Main St, Cape Town',
      status: 'approved',
      totalKg: 15.5,
      totalValue: 23.25,
      totalPoints: 155,
      date: '2024-01-15',
      materials: [
        { name: 'PET Bottles', kg: 8.5, value: 12.75, points: 85 },
        { name: 'Aluminum Cans', kg: 7.0, value: 10.50, points: 70 }
      ]
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      address: '456 Oak Ave, Johannesburg',
      status: 'submitted',
      totalKg: 12.0,
      totalValue: 18.00,
      totalPoints: 120,
      date: '2024-01-14',
      materials: [
        { name: 'Glass', kg: 6.0, value: 7.20, points: 60 },
        { name: 'Paper', kg: 6.0, value: 10.80, points: 60 }
      ]
    }
  ]);

  const [customers] = useState<CustomerData[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+27 123 456 789',
      address: '123 Main St, Cape Town'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+27 987 654 321',
      address: '456 Oak Ave, Johannesburg'
    }
  ]);

  const [isNewPickupOpen, setIsNewPickupOpen] = useState(false);
  const [newPickupForm, setNewPickupForm] = useState({
    customerId: '',
    address: '',
    notes: '',
    materials: [{ name: '', kg: 0, value: 0, points: 0 }]
  });

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const addMaterialRow = () => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', kg: 0, value: 0, points: 0 }]
    }));
  };

  const removeMaterialRow = (index: number) => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialRow = (index: number, field: string, value: any) => {
    setNewPickupForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleCreatePickup = () => {
    const newPickup: PickupData = {
      id: Date.now().toString(),
      customerName: customers.find(c => c.id === newPickupForm.customerId)?.name || '',
      customerEmail: customers.find(c => c.id === newPickupForm.customerId)?.email || '',
      address: newPickupForm.address,
      status: 'submitted',
      totalKg: newPickupForm.materials.reduce((sum, m) => sum + m.kg, 0),
      totalValue: newPickupForm.materials.reduce((sum, m) => sum + m.value, 0),
      totalPoints: newPickupForm.materials.reduce((sum, m) => sum + m.points, 0),
      date: new Date().toISOString().split('T')[0],
      materials: newPickupForm.materials.filter(m => m.name && m.kg > 0)
    };

    setPickups(prev => [newPickup, ...prev]);
    setNewPickupForm({
      customerId: '',
      address: '',
      notes: '',
      materials: [{ name: '', kg: 0, value: 0, points: 0 }]
    });
    setIsNewPickupOpen(false);
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

  // Calculate stats
  const stats = {
    totalCollections: pickups.length,
    totalKg: pickups.reduce((sum, p) => sum + p.totalKg, 0),
    totalPoints: pickups.reduce((sum, p) => sum + p.totalPoints, 0),
    totalEarnings: pickups.reduce((sum, p) => sum + p.totalValue, 0),
    monthlyCollections: pickups.filter(p => p.date.startsWith('2024-01')).length,
    monthlyKg: pickups.filter(p => p.date.startsWith('2024-01')).reduce((sum, p) => sum + p.totalKg, 0),
    monthlyPoints: pickups.filter(p => p.date.startsWith('2024-01')).reduce((sum, p) => sum + p.totalPoints, 0),
    monthlyEarnings: pickups.filter(p => p.date.startsWith('2024-01')).reduce((sum, p) => sum + p.totalValue, 0)
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

  // Show error if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Not Authenticated</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the collector dashboard.</p>
          <Button onClick={() => window.location.href = '/'}>Go to Login</Button>
        </div>
      </div>
    );
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
                <p className="text-sm text-muted-foreground">Welcome, {user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Target className="h-4 w-4 mr-1" />
                Rank #1
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Zap className="h-4 w-4 mr-1" />
                5 Day Streak
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
              <Card className="bg-gradient-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCollections}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-success text-success-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Kg Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalKg.toFixed(1)} kg</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-accent text-accent-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-warm text-warm-foreground">
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
                  This Month's Performance
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
                    <div className="text-2xl font-bold text-success">{stats.monthlyKg.toFixed(1)} kg</div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-accent">{stats.monthlyPoints.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Points</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-warm">R {stats.monthlyEarnings.toFixed(2)}</div>
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
                                  {customer.name} ({customer.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Address */}
                        <div>
                          <Label htmlFor="address">Pickup Address</Label>
                          <Input
                            placeholder="Enter pickup address"
                            value={newPickupForm.address}
                            onChange={(e) => setNewPickupForm(prev => ({ ...prev, address: e.target.value }))}
                          />
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
                                  <Input
                                    placeholder="e.g., PET Bottles"
                                    value={material.name}
                                    onChange={(e) => updateMaterialRow(index, 'name', e.target.value)}
                                  />
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
                                  <Label>Value (R)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={material.value}
                                    onChange={(e) => updateMaterialRow(index, 'value', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
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
                          disabled={!newPickupForm.customerId || !newPickupForm.address}
                          className="w-full"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Create Pickup
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                    <MapPin className="h-6 w-6" />
                    <span>View Route</span>
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
                    <div key={pickup.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{pickup.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {pickup.totalKg} kg • {pickup.totalPoints} points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(pickup.status)}
                        <span className="text-sm text-muted-foreground">
                          {pickup.date}
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Pickup Management</h2>
              <Dialog open={isNewPickupOpen} onOpenChange={setIsNewPickupOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Pickup
                  </Button>
                </DialogTrigger>
                {/* Same dialog content as above */}
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Pickups</CardTitle>
                <CardDescription>Manage your recycling collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pickups.map((pickup) => (
                    <div key={pickup.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{pickup.customerName}</h3>
                            <p className="text-sm text-muted-foreground">{pickup.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(pickup.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Weight:</span>
                          <p className="font-medium">{pickup.totalKg} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p className="font-medium">R {pickup.totalValue}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Points:</span>
                          <p className="font-medium">{pickup.totalPoints}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{pickup.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{pickup.address}</span>
                      </div>

                      {pickup.materials.length > 0 && (
                        <div className="bg-muted p-3 rounded-lg">
                          <h4 className="font-medium mb-2">Materials Breakdown:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            {pickup.materials.map((material, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{material.name}:</span>
                                <span>{material.kg} kg (R{material.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <h2 className="text-2xl font-bold">Customer Management</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Customers</CardTitle>
                <CardDescription>Manage your customer relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MapPin className="h-4 w-4 mr-2" />
                          View Addresses
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <History className="h-4 w-4 mr-2" />
                          History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>Your collection performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Collections per month</span>
                      <span className="font-medium">{stats.monthlyCollections}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average kg per pickup</span>
                      <span className="font-medium">
                        {stats.totalCollections > 0 ? (stats.totalKg / stats.totalCollections).toFixed(1) : 0} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Points per kg</span>
                      <span className="font-medium">
                        {stats.totalKg > 0 ? (stats.totalPoints / stats.totalKg).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Environmental Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-success" />
                    Environmental Impact
                  </CardTitle>
                  <CardDescription>Your contribution to sustainability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>CO2 saved</span>
                      <span className="font-medium text-success">
                        {(stats.totalKg * 2.5).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Water saved</span>
                      <span className="font-medium text-success">
                        {(stats.totalKg * 25).toFixed(0)} L
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trees equivalent</span>
                      <span className="font-medium text-success">
                        {((stats.totalKg * 2.5) / 22).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Top Materials Collected</CardTitle>
                <CardDescription>Your most collected recyclable materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['PET Bottles', 'Aluminum Cans', 'Glass', 'Paper', 'Cardboard'].map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{material}</p>
                          <p className="text-sm text-muted-foreground">Recyclable</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{1.5 + index * 0.5}/kg</p>
                        <p className="text-sm text-muted-foreground">kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
