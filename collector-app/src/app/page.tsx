"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  Target, 
  Leaf, 
  DollarSign, 
  Play,
  Users,
  BarChart3,
  Loader2,
  TrendingUp,
  X,
  Plus,
  Search,
  Camera,
  Trash2,
  Settings
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { profileServices } from "@/lib/supabase-services";
import type { ProfileWithAddresses } from "@/lib/supabase";

// Customer data will be loaded from API
interface CustomerWithAddresses extends ProfileWithAddresses {
  name: string;
  address: string;
  city: string;
}

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalKg: 0,
    totalPoints: 0
  });
  const [showLiveCollection, setShowLiveCollection] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('aluminium');
  const [weight, setWeight] = useState(0);
  
  // New state for customer search and photo capture
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerWithAddresses[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithAddresses[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithAddresses | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load basic stats on component mount
  useEffect(() => {
    if (user) {
      loadBasicStats();
    }
  }, [user]);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchTerm]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  // Redirect non-collectors to unauthorized page
  useEffect(() => {
    if (user && user.role) {
      console.log('🔍 Debug - User role check:', {
        userRole: user.role,
        allowedRoles: ['collector', 'admin', 'COLLECTOR', 'ADMIN'],
        isAllowed: ['collector', 'admin', 'COLLECTOR', 'ADMIN'].includes(user.role)
      });
      
      if (!['collector', 'admin', 'COLLECTOR', 'ADMIN'].includes(user.role)) {
        console.log('❌ User role not allowed, redirecting to unauthorized');
        window.location.href = '/unauthorized';
      } else {
        console.log('✅ User role allowed, staying on dashboard');
      }
    } else if (user) {
      console.log('🔍 Debug - User exists but no role:', user);
      // For development, allow users without roles to access the dashboard
      console.log('⚠️ Development mode: Allowing user without role to access dashboard');
    }
  }, [user]);

  const loadBasicStats = async () => {
    try {
      setIsLoading(true);
      
      // Load customers from Supabase
      const customerProfiles = await profileServices.getCustomerProfilesWithAddresses();
      
      // Transform the data to include name and address
      const customersWithAddresses: CustomerWithAddresses[] = customerProfiles.map(profile => {
        const primaryAddress = profile.addresses?.find(addr => addr.is_primary) || profile.addresses?.[0];
        
        return {
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Unknown Customer',
          address: primaryAddress ? `${primaryAddress.line1}, ${primaryAddress.suburb}` : 'No address',
          city: primaryAddress?.city || 'Unknown'
        };
      });
      
      setCustomers(customersWithAddresses);
      setFilteredCustomers(customersWithAddresses);
      
      // Load actual stats from API
      if (!user) return;
      
      const { data: pickupsData } = await supabase
        .from('pickups')
        .select('total_kg, status')
        .eq('collector_id', user.id);
      
      const totalCollections = pickupsData?.filter((p: any) => p.status === 'approved' || p.status === 'completed').length || 0;
      const totalKg = pickupsData?.filter((p: any) => p.status === 'approved' || p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.total_kg || 0), 0) || 0;
      const totalPoints = totalKg * 6; // 6 points per kg
      
      const realStats = {
        totalCollections,
        totalKg,
        totalPoints
      };
      setStats(realStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaterialType = () => {
    return selectedMaterial === 'aluminium' ? 'Aluminium Cans' : 'Plastic Bottles';
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const photoUrl = URL.createObjectURL(blob);
          setCapturedPhotos(prev => [...prev, photoUrl]);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      return newPhotos;
    });
  };

  const selectCustomer = (customer: CustomerWithAddresses) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setFilteredCustomers([]);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setFilteredCustomers(customers);
  };

  // Show loading while checking authentication
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/W yellow.png" 
                  alt="Woza Mali Logo" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Woza Mali</h1>
                <p className="text-sm text-gray-300">Collector Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user?.email || 'Collector'}
                </p>
                <p className="text-xs text-orange-400 font-semibold">COLLECTOR</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-24">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Collector'}!
          </h2>
          <p className="text-gray-300">
            Manage your recycling collections and track your performance
          </p>
        </div>

        {/* Quick Actions - Simplified Small Buttons */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={() => setShowLiveCollection(true)}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-3 py-1.5 h-12 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Live Collection
            </Button>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-3 py-1.5 h-12 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/pickups">
                New Pickup
              </Link>
            </Button>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-black px-3 py-1.5 h-12 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/customers">
                Customer
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-400" />
                Total Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-400">{stats.totalCollections}</div>
              <p className="text-xs text-gray-400 mt-1">Lifetime total</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-400" />
                Total Kg Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-400">{stats.totalKg.toFixed(1)} kg</div>
              <p className="text-xs text-gray-400 mt-1">Lifetime total</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-orange-400" />
                Collection Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-400">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">Lifetime total</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="grid gap-4">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No recent activity</h3>
                <p className="text-gray-300 text-center">
                  Your collection activities will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Live Collection Popup */}
      {showLiveCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-white">Record Collection</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLiveCollection(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              {/* Customer Search Section */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Customer Search</h4>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search customers by name, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Search Results */}
                {searchTerm && filteredCustomers.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto bg-gray-700 rounded-lg border border-gray-600">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => selectCustomer(customer)}
                        className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      >
                        <div className="font-medium text-white">{customer.name}</div>
                        <div className="text-sm text-gray-300">{customer.phone}</div>
                        <div className="text-xs text-gray-400">{customer.address}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected Customer Display */}
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">Selected: {selectedCustomer.name}</div>
                        <div className="text-sm text-orange-300">{selectedCustomer.phone}</div>
                        <div className="text-xs text-orange-200">{selectedCustomer.address}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCustomerSelection}
                        className="text-orange-300 hover:text-white hover:bg-orange-500/30"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Material Selection Tabs */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Select Materials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMaterial === 'aluminium' 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-gray-600 hover:border-orange-400 bg-gray-700'
                    }`}
                    onClick={() => setSelectedMaterial('aluminium')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Aluminium Cans</h5>
                        <p className="text-sm text-gray-300">Aluminium Cans</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-400 text-lg">Aluminium</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMaterial === 'plastic' 
                        ? 'border-yellow-500 bg-yellow-500/10' 
                        : 'border-gray-600 hover:border-yellow-400 bg-gray-700'
                    }`}
                    onClick={() => setSelectedMaterial('plastic')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Plastic Bottles</h5>
                        <p className="text-sm text-gray-300">Plastic Bottles</p>
                        <p className="text-xs text-blue-400 font-medium">Donated to Green Scholar Fund</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400 text-lg">Plastic</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weight Input Section */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Weight Measurement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Input */}
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg font-medium text-white placeholder-gray-400"
                    />
                  </div>

                  {/* Photo Capture Section */}
                  <div className="text-center">
                    <h5 className="text-sm font-medium text-white mb-3">Photo Evidence</h5>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {capturedPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={photo} 
                            alt={`Collection photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-600"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={startCamera}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Collection Summary */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-3">Collection Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Customer:</p>
                    <p className="font-medium text-white">
                      {selectedCustomer ? selectedCustomer.name : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Material Type:</p>
                    <p className="font-medium text-white">
                      {selectedMaterial === 'aluminium' ? 'Aluminium Cans' : 'Plastic Bottles'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Weight Recorded:</p>
                    <p className="font-bold text-orange-400 text-lg">{weight.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Photos Taken:</p>
                    <p className="font-medium text-white">{capturedPhotos.length} photos</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Collection
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setShowLiveCollection(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Take Photo</h3>
              <p className="text-sm text-gray-300">Position the recyclables in frame</p>
            </div>
            
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border border-gray-600"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Mobile Optimized - DARK GREY + ORANGE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-orange-500 text-white">
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </div>

          {/* Pickups Tab */}
          <Link
            href="/pickups"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </Link>

          {/* Customers Tab */}
          <Link
            href="/customers"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Customers</span>
          </Link>

          {/* Analytics Tab */}
          <Link
            href="/analytics"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <TrendingUp className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>

          {/* Settings Tab */}
          <Link
            href="/settings"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}