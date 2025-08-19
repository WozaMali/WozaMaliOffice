import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  MapPin, 
  Search, 
  Plus, 
  History, 
  Camera, 
  Scale,
  Recycle,
  CheckCircle,
  Clock,
  AlertCircle,
  Route,
  User,
  Calendar,
  Package,
  TrendingUp,
  Target,
  Award,
  Users,
  BarChart3,
  Zap,
  Leaf,
  X,
  Image as ImageIcon
} from "lucide-react";
import { MaterialType, calculateTransactionTotals, formatCurrency, formatWeight, formatPoints } from "@/lib/recycling-schema";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { pickupServices, materialServices, collectorServices } from "@/lib/supabase-services";

interface PickupLocation {
  id: string;
  address: string;
  customerName: string;
  assignedDate: string;
  status: 'pending' | 'completed' | 'overdue';
  materials: MaterialType[];
  phone?: string;
  email?: string;
  notes?: string;
}

interface PickupHistory {
  id: string;
  date: string;
  customerName: string;
  address: string;
  totalKg: number;
  totalValue: number;
  totalPoints: number;
  status: 'pending' | 'approved' | 'rejected';
  materials: Array<{
    type: MaterialType;
    kg: number;
    price: number;
    points: number;
  }>;
}

interface NewPickupForm {
  customerName: string;
  address: string;
  phone?: string;
  email?: string;
  materials: Array<{
    type: MaterialType;
    kg: number;
    photos: string[];
  }>;
  notes: string;
}

interface MaterialPhoto {
  type: MaterialType;
  kg: number;
  photos: string[];
}

// Mock data for collector metrics
const mockCollectorMetrics = {
  personal: {
    totalCollections: 156,
    totalKgCollected: 2347.5,
    totalPoints: 3456,
    totalEarnings: 2347.50,
    streak: 12,
    rank: 3,
    monthlyGoal: 85,
    weeklyProgress: 67
  },
  team: {
    totalCollectors: 8,
    teamTotalKg: 18750.3,
    teamTotalPoints: 28450,
    teamTotalEarnings: 18750.30,
    teamRank: 2,
    topCollector: "Emma Wilson",
    topCollectorKg: 3120.8,
    averagePerCollector: 2343.8
  },
  environmental: {
    co2Saved: 2347.5 * 2.5, // 2.5kg CO2 per kg recycled
    waterSaved: 2347.5 * 100, // 100L water per kg recycled
    landfillSaved: 2347.5 * 0.8, // 0.8kg landfill per kg recycled
    treesEquivalent: Math.floor(2347.5 / 50) // 1 tree per 50kg recycled
  }
};

// Mock data
const mockAssignedStops: PickupLocation[] = [
  {
    id: '1',
    address: '123 Main Street, Cape Town',
    customerName: 'Sarah Johnson',
    assignedDate: '2024-01-15',
    status: 'pending',
    materials: ['PET', 'ALUMINUM_CANS', 'PAPER'],
    phone: '+27 82 123 4567',
    email: 'sarah.johnson@email.com',
    notes: 'Customer prefers afternoon pickups'
  },
  {
    id: '2',
    address: '456 Oak Avenue, Cape Town',
    customerName: 'Mike Chen',
    assignedDate: '2024-01-15',
    status: 'pending',
    materials: ['GLASS', 'PAPER', 'ELECTRONICS'],
    phone: '+27 83 456 7890',
    email: 'mike.chen@email.com',
    notes: 'Large quantities expected'
  },
  {
    id: '3',
    address: '789 Pine Road, Cape Town',
    customerName: 'Lisa Thompson',
    assignedDate: '2024-01-16',
    status: 'pending',
    materials: ['PET', 'ALUMINUM_CANS'],
    phone: '+27 84 789 1234',
    email: 'lisa.thompson@email.com',
    notes: 'First time customer'
  }
];

const mockPickupHistory: PickupHistory[] = [
  {
    id: '1',
    date: '2024-01-14',
    customerName: 'John Smith',
    address: '321 Elm Street, Cape Town',
    totalKg: 15.5,
    totalValue: 45.75,
    totalPoints: 45,
    status: 'approved',
    materials: [
      { type: 'PET', kg: 8.0, price: 12.00, points: 12 },
      { type: 'ALUMINUM_CANS', kg: 2.5, price: 46.38, points: 46 },
      { type: 'PAPER', kg: 5.0, price: 6.00, points: 6 }
    ]
  },
  {
    id: '2',
    date: '2024-01-13',
    customerName: 'Emma Wilson',
    address: '654 Maple Drive, Cape Town',
    totalKg: 22.3,
    totalValue: 67.45,
    totalPoints: 67,
    status: 'pending',
    materials: [
      { type: 'GLASS', kg: 12.0, price: 30.00, points: 30 },
      { type: 'PAPER', kg: 10.3, price: 12.36, points: 12 }
    ]
  }
];

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<PickupLocation | null>(null);
  const [newPickup, setNewPickup] = useState<NewPickupForm>({
    customerName: '',
    address: '',
    materials: [],
    notes: ''
  });

  const [newMaterial, setNewMaterial] = useState<{ type: MaterialType; kg: number }>({
    type: 'PET',
    kg: 0
  });

  const [currentMaterialPhotos, setCurrentMaterialPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'scale' | 'materials' | 'material'>('scale');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter assigned stops based on search
  const filteredStops = mockAssignedStops.filter(stop =>
    stop.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals for new pickup
  const pickupCalculation = calculateTransactionTotals(
    newPickup.materials.map(m => ({ type: m.type, kg: m.kg }))
  );

  const handleCustomerSelect = (customer: PickupLocation) => {
    setSelectedCustomer(customer);
    setNewPickup(prev => ({
      ...prev,
      customerName: customer.customerName,
      address: customer.address,
      phone: customer.phone,
      email: customer.email
    }));
    setActiveTab('new-pickup');
  };

  const handleAddMaterial = () => {
    if (newMaterial.kg > 0 && currentMaterialPhotos.length > 0) {
      setNewPickup(prev => ({
        ...prev,
        materials: [...prev.materials, { 
          type: newMaterial.type, 
          kg: newMaterial.kg,
          photos: [...currentMaterialPhotos]
        }]
      }));
      setNewMaterial({ type: 'PET', kg: 0 });
      setCurrentMaterialPhotos([]);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setNewPickup(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === files.length) {
              setCurrentMaterialPhotos(prev => [...prev, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const openCamera = (type: 'scale' | 'materials' | 'material') => {
    setCurrentPhotoType(type);
    setIsCameraOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removePhoto = (photoIndex: number) => {
    setCurrentMaterialPhotos(prev => prev.filter((_, i) => i !== photoIndex));
  };

  const handleSubmitPickup = async () => {
    if (!user) return;

    try {
      // Calculate environmental impact
      const environmentalImpact = {
        co2Saved: pickupCalculation.totalKg * 2.5,
        waterSaved: pickupCalculation.totalKg * 100,
        landfillSaved: pickupCalculation.totalKg * 0.8,
        treesEquivalent: Math.floor(pickupCalculation.totalKg / 50)
      };

      // Create pickup in Supabase
      const pickupData = {
        collector_id: user.id,
        collector_name: user.email?.split('@')[0] || 'Unknown Collector',
        customer_name: newPickup.customerName || selectedCustomer?.customerName || '',
        customer_phone: selectedCustomer?.phone || null,
        customer_email: selectedCustomer?.email || null,
        address: newPickup.address || selectedCustomer?.address || '',
        total_kg: pickupCalculation.totalKg,
        total_value: pickupCalculation.totalPrice,
        total_points: pickupCalculation.totalPoints,
        notes: newPickup.notes || null,
        environmental_impact: environmentalImpact
      };

      const newPickupRecord = await pickupServices.createPickup(pickupData);
      
      if (newPickupRecord) {
        // Add materials to the pickup
        const materialsData = newPickup.materials.map(material => ({
          pickup_id: newPickupRecord.id,
          material_type: material.type,
          kg: material.kg,
          photos: material.photos
        }));

        await materialServices.addMaterials(newPickupRecord.id, materialsData);
        
        alert('Pickup submitted successfully! Admin will review and approve.');
        
        // Reset form
        setNewPickup({
          customerName: '',
          address: '',
          materials: [],
          notes: ''
        });
        setSelectedCustomer(null);
        setCurrentMaterialPhotos([]);
      } else {
        alert('Error submitting pickup. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting pickup:', error);
      alert('Error submitting pickup. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

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
                <p className="text-sm text-muted-foreground">COL-001 • John Smith</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Target className="h-4 w-4 mr-1" />
                Rank #{mockCollectorMetrics.personal.rank}
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Zap className="h-4 w-4 mr-1" />
                {mockCollectorMetrics.personal.streak} Day Streak
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="route" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route & Search
            </TabsTrigger>
            <TabsTrigger value="new-pickup" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Pickup
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Personal Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{mockCollectorMetrics.personal.totalCollections}</div>
                  <p className="text-xs opacity-90 mt-1">This month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-success text-success-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Kg Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatWeight(mockCollectorMetrics.personal.totalKgCollected)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-accent text-accent-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPoints(mockCollectorMetrics.personal.totalPoints)}</div>
                  <p className="text-xs opacity-90 mt-1">Earned this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-warm text-warm-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(mockCollectorMetrics.personal.totalEarnings)}</div>
                  <p className="text-xs opacity-90 mt-1">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress and Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Monthly Goal Progress
                  </CardTitle>
                  <CardDescription>Track your monthly collection targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weight Goal</span>
                      <span>{mockCollectorMetrics.personal.monthlyGoal}%</span>
                    </div>
                    <Progress value={mockCollectorMetrics.personal.monthlyGoal} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weekly Progress</span>
                      <span>{mockCollectorMetrics.personal.weeklyProgress}%</span>
                    </div>
                    <Progress value={mockCollectorMetrics.personal.weeklyProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-success" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Your recycling milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="font-medium text-success">100+ Collections</div>
                      <div className="text-sm text-muted-foreground">Completed milestone</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-primary">Top 3 Rank</div>
                      <div className="text-sm text-muted-foreground">Team leaderboard</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10">
                    <Zap className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-medium text-accent">12 Day Streak</div>
                      <div className="text-sm text-muted-foreground">Consistent performance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Performance
                </CardTitle>
                <CardDescription>How your team is performing collectively</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{mockCollectorMetrics.team.totalCollectors}</div>
                    <p className="text-sm text-muted-foreground">Active Collectors</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{formatWeight(mockCollectorMetrics.team.teamTotalKg)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Kg</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{formatPoints(mockCollectorMetrics.team.teamTotalPoints)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warm">{formatCurrency(mockCollectorMetrics.team.teamTotalEarnings)}</div>
                    <p className="text-sm text-muted-foreground">Team Total Earnings</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">🏆 Top Collector</div>
                      <div className="text-sm text-muted-foreground">{mockCollectorMetrics.team.topCollector}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatWeight(mockCollectorMetrics.team.topCollectorKg)}</div>
                      <div className="text-sm text-muted-foreground">This month</div>
                    </div>
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
                <CardDescription>Your contribution to a greener planet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{Math.round(mockCollectorMetrics.environmental.co2Saved)} kg</div>
                    <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(mockCollectorMetrics.environmental.waterSaved)} L</div>
                    <p className="text-sm text-muted-foreground">Water Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{Math.round(mockCollectorMetrics.environmental.landfillSaved)} kg</div>
                    <p className="text-sm text-muted-foreground">Landfill Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warm">{mockCollectorMetrics.environmental.treesEquivalent}</div>
                    <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Route & Search Tab */}
          <TabsContent value="route" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Search Assigned Stops
                </CardTitle>
                <CardDescription>
                  Find your assigned pickup locations and customer information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by customer name or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {filteredStops.map((stop) => (
                      <div key={stop.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCustomerSelect(stop)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{stop.customerName}</h3>
                              <p className="text-sm text-muted-foreground">{stop.address}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Assigned: {stop.assignedDate}
                                  </span>
                                </div>
                                {stop.phone && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{stop.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {stop.materials.join(', ')}
                            </Badge>
                            <Button size="sm" variant="outline">
                              Select Customer
                            </Button>
                          </div>
                        </div>
                        {stop.notes && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            <strong>Notes:</strong> {stop.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Pickup Tab */}
          <TabsContent value="new-pickup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-success" />
                  New Pickup Form
                </CardTitle>
                <CardDescription>
                  Record a new recycling pickup with materials, weights, and photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information - Auto-filled if selected from route */}
                {selectedCustomer && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-primary">Selected Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Customer Name</Label>
                          <p className="text-lg font-semibold">{selectedCustomer.customerName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Address</Label>
                          <p className="text-lg font-semibold">{selectedCustomer.address}</p>
                        </div>
                        {selectedCustomer.phone && (
                          <div>
                            <Label className="text-sm font-medium">Phone</Label>
                            <p className="text-lg font-semibold">{selectedCustomer.phone}</p>
                          </div>
                        )}
                        {selectedCustomer.email && (
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-lg font-semibold">{selectedCustomer.email}</p>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Selection
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Manual Customer Input (if no customer selected) */}
                {!selectedCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={newPickup.customerName}
                        onChange={(e) => setNewPickup(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newPickup.address}
                        onChange={(e) => setNewPickup(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter pickup address"
                      />
                    </div>
                  </div>
                )}

                {/* Materials Grid */}
                <div className="space-y-4">
                  <Label>Add New Material</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materialType">Material Type</Label>
                      <Select
                        value={newMaterial.type}
                        onValueChange={(value: MaterialType) =>
                          setNewMaterial(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PET">PET Plastic Bottles</SelectItem>
                          <SelectItem value="ALUMINUM_CANS">Aluminum Cans</SelectItem>
                          <SelectItem value="GLASS">Glass Bottles</SelectItem>
                          <SelectItem value="PAPER">Paper & Cardboard</SelectItem>
                          <SelectItem value="ELECTRONICS">Electronic Waste</SelectItem>
                          <SelectItem value="BATTERIES">Batteries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={newMaterial.kg}
                        onChange={(e) =>
                          setNewMaterial(prev => ({ ...prev, kg: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {/* Photo Capture for Current Material */}
                  <div className="space-y-4">
                    <Label>Photos for {newMaterial.type}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border-2 border-dashed border-muted text-center">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Scale Photo</p>
                        <p className="text-xs text-muted-foreground">Show weight on scale</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => openCamera('scale')}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border-2 border-dashed border-muted text-center">
                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Materials Photo</p>
                        <p className="text-xs text-muted-foreground">Show materials clearly</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => openCamera('materials')}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                    </div>

                    {/* Hidden file input for camera */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {/* Current Photos Display */}
                    {currentMaterialPhotos.length > 0 && (
                      <div className="space-y-3">
                        <Label>Current Photos ({currentMaterialPhotos.length})</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {currentMaterialPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddMaterial} 
                    disabled={newMaterial.kg <= 0 || currentMaterialPhotos.length === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material to Pickup
                  </Button>
                </div>

                {/* Current Materials List */}
                {newPickup.materials.length > 0 && (
                  <div className="space-y-3">
                    <Label>Materials in Pickup ({newPickup.materials.length})</Label>
                    <div className="space-y-2">
                      {newPickup.materials.map((material, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{material.type}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatWeight(material.kg)} • {material.photos.length} photos
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {material.photos.slice(0, 3).map((photo, photoIndex) => (
                                <img
                                  key={photoIndex}
                                  src={photo}
                                  alt={`Photo ${photoIndex + 1}`}
                                  className="w-8 h-8 object-cover rounded border"
                                />
                              ))}
                              {material.photos.length > 3 && (
                                <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs">
                                  +{material.photos.length - 3}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMaterial(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    value={newPickup.notes}
                    onChange={(e) => setNewPickup(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions or notes..."
                  />
                </div>

                {/* Summary */}
                {newPickup.materials.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Pickup Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {formatWeight(pickupCalculation.totalKg)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Weight</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-success">
                            {formatCurrency(pickupCalculation.totalPrice)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">
                            {formatPoints(pickupCalculation.totalPoints)}
                          </div>
                          <p className="text-sm text-muted-foreground">Points Earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitPickup} 
                  disabled={
                    newPickup.materials.length === 0 || 
                    (!newPickup.customerName && !selectedCustomer) || 
                    (!newPickup.address && !selectedCustomer)
                  }
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Pickup
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Pickup History
                </CardTitle>
                <CardDescription>
                  View your completed pickups and their approval status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPickupHistory.map((pickup) => (
                    <div key={pickup.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{pickup.customerName}</h3>
                          <p className="text-sm text-muted-foreground">{pickup.address}</p>
                          <p className="text-xs text-muted-foreground">{pickup.date}</p>
                        </div>
                        <Badge className={getStatusColor(pickup.status)}>
                          {getStatusIcon(pickup.status)}
                          <span className="ml-1 capitalize">{pickup.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {formatWeight(pickup.totalKg)}
                          </div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-success">
                            {formatCurrency(pickup.totalValue)}
                          </div>
                          <p className="text-xs text-muted-foreground">Value</p>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">
                            {formatPoints(pickup.totalPoints)}
                          </div>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {pickup.materials.map((material, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {material.type}: {formatWeight(material.kg)}
                          </Badge>
                        ))}
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
