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
  Upload,
  Calculator,
  User,
  Search,
  Scale,
  Star,
  RefreshCw
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
  const [stats, setStats] = useState<{
    totalCollections: number;
    totalKg: number;
    totalPoints: number;
    totalEarnings: number;
    monthlyCollections: number;
    monthlyKg: number;
    monthlyPoints: number;
    monthlyEarnings: number;
  }>(() => {
    // Load from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collector-dashboard-stats');
      return saved ? JSON.parse(saved) : {
        totalCollections: 0,
        totalKg: 0,
        totalPoints: 0,
        totalEarnings: 0,
        monthlyCollections: 0,
        monthlyKg: 0,
        monthlyPoints: 0,
        monthlyEarnings: 0,
      };
    }
    return {
      totalCollections: 0,
      totalKg: 0,
      totalPoints: 0,
      totalEarnings: 0,
      monthlyCollections: 0,
      monthlyKg: 0,
      monthlyPoints: 0,
      monthlyEarnings: 0,
    };
  });

  const [isNewPickupOpen, setIsNewPickupOpen] = useState(false);
  const [newPickupForm, setNewPickupForm] = useState({
    customerId: '',
    addressId: '',
    notes: '',
    materials: [{ materialId: '', kg: 0, contamination: 0 }]
  });

    // Customer collection tracking
  const [customerCollections, setCustomerCollections] = useState<Record<string, {
    materialId: string;
    kg: number;
    contamination: number;
  }>>({});

  const [customerMetrics, setCustomerMetrics] = useState<Record<string, {
    value: number;
    points: number;
    co2Saved: number;
        waterSaved: number;
  }>>(() => {
    // Load from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collector-customer-metrics');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Filtered customers for search
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  // Collection modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [recentCollections, setRecentCollections] = useState<Array<{
    customerId: string;
    materialName: string;
    customerName: string;
    kg: number;
    value: number;
    date: string;
  }>>(() => {
    // Load from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collector-recent-collections');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Collection form state
  const [collectionForm, setCollectionForm] = useState({
    materialId: '',
    kg: 0,
    scalePhoto: null as File | null,
    recyclablesPhoto: null as File | null
  });

  // Track if user has started typing in kg field
  const [kgInputStarted, setKgInputStarted] = useState(false);
  
  // Track if collection is being saved
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // Multiple materials collection state
  const [collectedMaterials, setCollectedMaterials] = useState<Array<{
    materialId: string;
    materialName: string;
    kg: number;
    value: number;
    points: number;
    co2Saved: number;
    waterSaved: number;
  }>>(() => {
    // Load from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('collector-collected-materials');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Initialize filtered customers when customers change
  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

  // Load persisted data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔄 Loading persisted data from localStorage...');
      
      // Load dashboard stats
      const savedStats = localStorage.getItem('collector-dashboard-stats');
      if (savedStats) {
        console.log('📊 Loaded saved dashboard stats');
      }
      
      // Load recent collections
      const savedCollections = localStorage.getItem('collector-recent-collections');
      if (savedCollections) {
        console.log('📦 Loaded saved recent collections');
      }
      
      // Load customer metrics
      const savedMetrics = localStorage.getItem('collector-customer-metrics');
      if (savedMetrics) {
        console.log('👥 Loaded saved customer metrics');
      }
      
      // Load collected materials (if any)
      const savedMaterials = localStorage.getItem('collector-collected-materials');
      if (savedMaterials) {
        console.log('♻️ Loaded saved collected materials');
      }
    }
  }, []);

  const loadDashboardData = async (forceRefresh = false) => {
    if (!user) return;
    
    try {
      console.log('🔄 Starting loadDashboardData...', forceRefresh ? '(FORCE REFRESH)' : '');
      setIsLoading(true);
      
      // Clear any cached data if force refresh
      if (forceRefresh) {
        console.log('🧹 Clearing cached data for force refresh...');
        setPickups([]);
        setStats({
          totalCollections: 0,
          totalKg: 0,
          totalPoints: 0,
          totalEarnings: 0,
          monthlyCollections: 0,
          monthlyKg: 0,
          monthlyPoints: 0,
          monthlyEarnings: 0,
        });
      }
      
      // Load pickups, users, materials, and stats in parallel
      const [pickupsData, usersData, materialsData, statsData] = await Promise.all([
        PickupService.getCollectorPickups(user.id),
        PickupService.getUsers(),
        PickupService.getMaterials(),
        PickupService.getCollectorStats(user.id)
      ]);

      console.log('📊 Data loaded from database:', {
        pickups: pickupsData?.length || 0,
        users: usersData?.length || 0,
        materials: materialsData?.length || 0,
        stats: statsData
      });

      setPickups(pickupsData);
      setCustomers(usersData);
      setMaterials(materialsData);
      setStats(statsData);
      
      console.log('✅ Dashboard data updated successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', {
        error,
        user: user?.id,
        timestamp: new Date().toISOString()
      });
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

  // Customer collection functions
  const updateCustomerCollection = (customerId: string, field: string, value: any) => {
    setCustomerCollections(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: value
      }
    }));
  };

  const calculateCustomerMetrics = (customerId: string) => {
    const collection = customerCollections[customerId];
    if (!collection?.materialId || !collection?.kg) return;

    const material = materials.find(m => m.id === collection.materialId);
    if (!material) return;

    // Calculate value (considering contamination)
    const effectiveKg = collection.kg * (1 - collection.contamination / 100);
    const value = effectiveKg * material.rate_per_kg;
    
    // Calculate points (1 point per R10 value)
    const points = Math.floor(value / 10);
    
    // Environmental impact calculations (example values)
    const co2Saved = effectiveKg * 2.5; // kg CO2 saved per kg recycled
    const waterSaved = effectiveKg * 100; // L water saved per kg recycled

    setCustomerMetrics(prev => ({
      ...prev,
      [customerId]: {
        value,
        points,
        co2Saved,
        waterSaved
      }
    }));

    toast.success(`Metrics calculated for ${customers.find(c => c.id === customerId)?.full_name}`);
  };

  // Photo upload handlers
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'scale' | 'recyclables') => {
    const file = event.target.files?.[0];
    if (file) {
      setCollectionForm(prev => ({
        ...prev,
        [type === 'scale' ? 'scalePhoto' : 'recyclablesPhoto']: file
      }));
    }
  };

  // Add material to collection
  const handleAddMaterial = () => {
    if (!collectionForm.materialId || !collectionForm.kg) {
      toast.error('Please fill in all required fields');
      return;
    }

    const material = materials.find(m => m.id === collectionForm.materialId);
    if (!material) {
      toast.error('Material not found');
      return;
    }

    const value = collectionForm.kg * material.rate_per_kg;
    const points = Math.floor(value / 10); // 1 point per R10
    const co2Saved = collectionForm.kg * 2.5;
    const waterSaved = collectionForm.kg * 100;

    const newMaterial = {
      materialId: collectionForm.materialId,
      materialName: material.name,
      kg: collectionForm.kg,
      value,
      points,
      co2Saved,
      waterSaved
    };

    setCollectedMaterials(prev => {
      const updated = [...prev, newMaterial];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('collector-collected-materials', JSON.stringify(updated));
      }
      return updated;
    });

    // Reset form for next material
    setCollectionForm({
      materialId: '',
      kg: 0,
      scalePhoto: null,
      recyclablesPhoto: null
    });
    setKgInputStarted(false); // Reset the input state

    toast.success(`${collectionForm.kg}kg of ${material.name} added to collection!`);
  };

  // Save collection
  const handleSaveCollection = async () => {
    if (!selectedCustomerId || !collectionForm.materialId || !collectionForm.kg) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSavingCollection(true);

    try {
      const material = materials.find(m => m.id === collectionForm.materialId);
      if (!material) {
        toast.error('Material not found');
        return;
      }

      // Calculate value and environmental impact
      const value = collectionForm.kg * material.rate_per_kg;
      const points = Math.floor(value / 10); // 1 point per R10 // 1 point per R1
      const co2Saved = collectionForm.kg * 2.5; // kg CO2 saved per kg recycled
      const waterSaved = collectionForm.kg * 100; // L water saved per kg recycled

      // Note: We no longer create temporary pickup records since we reload from database
      // This ensures data consistency across the platform

      // Note: Stats will be updated when we reload from database
      // This ensures consistency across the platform

      // Add to recent collections
      const newCollection = {
        customerId: selectedCustomerId,
        customerName: customers.find(c => c.id === selectedCustomerId)?.full_name || 'Unknown Customer',
        materialName: material.name,
        kg: collectionForm.kg,
        value: value,
        date: new Date().toLocaleDateString()
      };

      setRecentCollections(prev => {
        const updated = [newCollection, ...prev.slice(0, 9)]; // Keep last 10
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('collector-recent-collections', JSON.stringify(updated));
        }
        return updated;
      });

      // Note: Customer metrics will be updated when we reload from database
      // This ensures consistency across the platform

      // Save to database for persistence across platform
      try {
        console.log('🔄 Attempting to save pickup to database...');
        console.log('User ID:', user?.id);
        console.log('Selected Customer ID:', selectedCustomerId);
        
        // Create pickup in database
        const pickupData: CreatePickupData = {
          customer_id: selectedCustomerId,
          address_id: null, // Set to null instead of empty string
          notes: `Collection recorded via quick entry: ${material.name}`,
          materials: [{
            material_id: collectionForm.materialId,
            kilograms: collectionForm.kg,
            contamination_pct: 0 // Default to 0 for now
          }]
        };

        console.log('📝 Pickup data to save:', pickupData);

        // Save pickup to database
        const pickupId = await PickupService.createPickup(pickupData, user?.id || '');
        console.log('💾 Database response - Pickup ID:', pickupId);
        
        if (pickupId) {
          console.log('✅ Pickup saved successfully with ID:', pickupId);
          
          // Small delay to ensure database has time to update
          console.log('⏳ Waiting for database to update...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reload dashboard data from database to ensure consistency
          console.log('🔄 Reloading dashboard data after successful save...');
          await loadDashboardData(true); // Force refresh to ensure latest data
          console.log('✅ Dashboard data reloaded successfully');
          
          toast.success('Collection saved to database successfully!', {
            description: 'Dashboard data refreshed with latest information'
          });
        } else {
          console.warn('⚠️ Pickup save returned null/undefined ID');
          toast.warning('Collection saved locally but database sync failed');
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        console.error('Error details:', {
          message: (dbError as any)?.message,
          stack: (dbError as any)?.stack,
          name: (dbError as any)?.name
        });
        toast.error('Database save failed - collection saved locally only');
        // Don't fail the UI update - collection is still recorded locally
      }

      // Reset form and close modal
      setCollectionForm({
        materialId: '',
        kg: 0,
        scalePhoto: null,
        recyclablesPhoto: null
      });
      setKgInputStarted(false); // Reset the input state
      
      // Clear collected materials from localStorage after successful save
      if (typeof window !== 'undefined') {
        localStorage.removeItem('collector-collected-materials');
      }
      setCollectedMaterials([]);
      
      setIsCollectionModalOpen(false);
      setSelectedCustomerId('');

      // Success notification with details
      toast.success(
        `Collection recorded successfully! ${collectionForm.kg}kg of ${material.name} = R${value.toFixed(2)}`,
        {
          description: `${points} points earned (R10 = 1 point) • ${co2Saved.toFixed(1)}kg CO2 saved • ${waterSaved.toFixed(0)}L water saved • Dashboard updated from database`
        }
      );

      // Optional: Switch to Overview tab to show updated stats
      setActiveTab('overview');

    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Failed to save collection');
    } finally {
      setIsSavingCollection(false);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 flex items-center justify-center">
                <img 
                  src={theme === 'dark' ? '/w white.png' : '/w yellow.png'} 
                  alt="Woza Mali Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Collector Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadDashboardData(true)}
                disabled={isLoading}
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-600 dark:hover:bg-slate-800 transition-all duration-200 px-4 py-2"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2 font-medium">
                <Target className="h-4 w-4 mr-2" />
                {user.role}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout()}
                className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 px-4 py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </div>
            </TabsTrigger>
            <TabsTrigger value="pickups" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Pickups
              </div>
            </TabsTrigger>
            <TabsTrigger value="customers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customers
              </div>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalCollections}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Total Kg Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalKg.toFixed(1)} kg</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Total Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalPoints.toLocaleString()}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total • R10 = 1 point</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">R {stats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Performance */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  This Month&apos;s Performance
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Your recycling achievements for the current month
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (Total Pickups: {pickups.length})
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-200">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.monthlyCollections}</div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Collections</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-200">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.monthlyKg.toFixed(1)} kg</div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">Weight</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-200">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.monthlyPoints.toLocaleString()}</div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Points (R10=1)</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg transition-all duration-200">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">R {stats.monthlyEarnings.toFixed(2)}</div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Earnings</p>
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
                              {[]} {/* Temporarily empty until we fix the addresses relationship */}
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
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Quick Collection Entry
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Select customer and record collection with photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Customer Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-select" className="text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{customers.length}</span>
                          </div>
                          Select Customer
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          ✨ Collection form opens automatically when you select a customer
                        </span>
                      </Label>
                      <Select 
                        value={selectedCustomerId} 
                        onValueChange={(value) => {
                          setSelectedCustomerId(value);
                          // Automatically open collection modal when customer is selected
                          if (value) {
                            // Reset form and collected materials for new customer
                            setCollectionForm({
                              materialId: '',
                              kg: 0,
                              scalePhoto: null,
                              recyclablesPhoto: null
                            });
                            setKgInputStarted(false); // Reset the input state
                            setCollectedMaterials([]); // Clear previous materials
                            // Clear collected materials from localStorage for new customer
                            if (typeof window !== 'undefined') {
                              localStorage.removeItem('collector-collected-materials');
                            }
                            setIsCollectionModalOpen(true);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a customer..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
                          <div className="p-2 bg-white dark:bg-gray-800">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <Input
                                placeholder="Search customers..."
                                className="pl-8 mb-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                onChange={(e) => {
                                  const searchTerm = e.target.value.toLowerCase();
                                  if (searchTerm === '') {
                                    setFilteredCustomers(customers); // Show all customers when search is cleared
                                  } else {
                                    const filtered = customers.filter(customer =>
                                      customer.full_name.toLowerCase().includes(searchTerm) ||
                                      customer.email.toLowerCase().includes(searchTerm) ||
                                      customer.phone?.includes(searchTerm)
                                    );
                                    setFilteredCustomers(filtered);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto bg-white dark:bg-gray-800">
                            {filteredCustomers.length > 0 ? (
                              filteredCustomers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-white">{customer.full_name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {customer.email} • {customer.phone || 'No phone'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                                {customers.length === 0 ? 'No customers available' : 'No customers match your search'}
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <div className="w-full p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                        <p className="text-sm text-muted-foreground">
                          Select a customer above to start recording collection
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Collections */}
                  <div className="mt-8">
                    <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      Recent Collections
                    </h4>
                    <div className="space-y-3">
                      {recentCollections.length > 0 ? (
                        recentCollections.map((collection, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                <Package className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {customers.find(c => c.id === collection.customerId)?.full_name}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {collection.materialName} • {collection.kg}kg
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">R {collection.value.toFixed(2)}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{collection.date}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No collections recorded yet</p>
                          <p className="text-sm">Start by selecting a customer above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Overview */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Performance Analytics
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Detailed insights into your recycling impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Environmental Impact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                        <span className="text-gray-700 dark:text-gray-300">CO2 Saved:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.co2_saved || 0), 0).toFixed(2)} kg</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                        <span className="text-gray-700 dark:text-gray-300">Water Saved:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.water_saved || 0), 0).toFixed(2)} L</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                        <span className="text-gray-700 dark:text-gray-300">Landfill Saved:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{pickups.reduce((sum, p) => sum + (p.environmental_impact?.landfill_saved || 0), 0).toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                        <span className="text-gray-700 dark:text-gray-300">Total Earnings:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">R {stats.totalEarnings.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200/50 dark:border-indigo-700/50">
                        <span className="text-gray-700 dark:text-gray-300">Monthly Average:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">R {(stats.totalEarnings / Math.max(stats.totalCollections, 1)).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
                        <span className="text-gray-700 dark:text-gray-300">Total Points:</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.totalPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Progress Chart */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Monthly Progress</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">This month's collection performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Collections</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.monthlyCollections}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.monthlyCollections / Math.max(stats.totalCollections, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Weight (kg)</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.monthlyKg.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.monthlyKg / Math.max(stats.totalKg, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Environmental Impact Chart */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Environmental Impact</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Your recycling contribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">CO2 Saved</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {pickups.reduce((sum, p) => sum + (p.environmental_impact?.co2_saved || 0), 0).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((pickups.reduce((sum, p) => sum + (p.environmental_impact?.co2_saved || 0), 0) / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Water Saved</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {pickups.reduce((sum, p) => sum + (p.environmental_impact?.water_saved || 0), 0).toFixed(0)} L
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((pickups.reduce((sum, p) => sum + (p.environmental_impact?.water_saved || 0), 0) / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Timeline */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Recent Activity Timeline</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Your latest recycling activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pickups.slice(0, 8).map((pickup, index) => (
                    <div key={pickup.pickup_id} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pickup.customer_name || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pickup.total_kg} kg collected • {pickup.total_points} points earned
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(pickup.started_at).toLocaleDateString()} at {new Date(pickup.started_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {pickup.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Collection Modal */}
      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                      <DialogHeader className="bg-white dark:bg-gray-900">
              <DialogTitle className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                Record Collection
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
                Record collection details and upload photos for verification
              </DialogDescription>
              
              {/* Points System Info Box */}
              <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-700">
                💡 <strong>Points System:</strong> Earn 1 point for every R10 of recyclables collected
              </div>
            </DialogHeader>
          
          {selectedCustomerId && (
            <div className="space-y-6 bg-white dark:bg-gray-900">
              {/* Customer Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {customers.find(c => c.id === selectedCustomerId)?.full_name}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customers.find(c => c.id === selectedCustomerId)?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customers.find(c => c.id === selectedCustomerId)?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Collection Form */}
              <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="collection-material" className="text-gray-700 dark:text-gray-300 font-medium">Material</Label>
                    <Select 
                      value={collectionForm.materialId} 
                      onValueChange={(value) => setCollectionForm(prev => ({ ...prev, materialId: value }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                        {materials.map(mat => (
                          <SelectItem key={mat.id} value={mat.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                            {mat.name} (R{mat.rate_per_kg}/kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="collection-kg" className="text-gray-700 dark:text-gray-300 font-medium">
                      Weight (kg)
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                        💡 R10 = 1 point
                      </span>
                    </Label>
                    <Input
                      id="collection-kg"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={kgInputStarted ? collectionForm.kg : (collectionForm.kg === 0 ? '' : collectionForm.kg)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!kgInputStarted) {
                          setKgInputStarted(true);
                        }
                        setCollectionForm(prev => ({ 
                          ...prev, 
                          kg: value === '' ? 0 : parseFloat(value) || 0 
                        }));
                      }}
                      onFocus={() => {
                        if (!kgInputStarted) {
                          setKgInputStarted(true);
                        }
                      }}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Collected Materials Summary */}
                {collectedMaterials.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Materials Collected ({collectedMaterials.length})
                    </h4>
                    <div className="space-y-2">
                      {collectedMaterials.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 text-sm font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{material.materialName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{material.kg}kg</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">R {material.value.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{material.points} points (R10=1)</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-800 dark:text-blue-300">Total:</span>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              R {collectedMaterials.reduce((sum, m) => sum + m.value, 0).toFixed(2)}
                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {collectedMaterials.reduce((sum, m) => sum + m.kg, 0).toFixed(1)}kg • {collectedMaterials.reduce((sum, m) => sum + m.points, 0)} points (R10=1)
                                </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Uploads */}
                <div className="space-y-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium">Scale Reading Photo</Label>
                    <div className="mt-2 flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'scale')}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium">Recyclables Photo</Label>
                    <div className="mt-2 flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'recyclables')}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-between items-center pt-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCollectionModalOpen(false)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline"
                      onClick={handleAddMaterial}
                      disabled={!collectionForm.materialId || !collectionForm.kg}
                      className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add More
                    </Button>
                    
                    <Button 
                      onClick={handleSaveCollection}
                      disabled={!collectionForm.materialId || !collectionForm.kg || isSavingCollection}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                    >
                      {isSavingCollection ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Save Collection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}