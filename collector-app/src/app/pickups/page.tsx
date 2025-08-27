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
  MapPin, 
  Plus, 
  History, 
  Package,
  Clock,
  Loader2,
  Camera,
  Upload,
  Search,
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Settings
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { PickupService, type CreatePickupData } from "@/lib/pickup-service";
import type { CollectorDashboardView, Material } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

export default function CollectorPickupsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pickups, setPickups] = useState<CollectorDashboardView[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isNewPickupOpen, setIsNewPickupOpen] = useState(false);
  const [newPickupForm, setNewPickupForm] = useState({
    customerId: '',
    addressId: '',
    notes: '',
    materials: [{ materialId: '', kg: 0, contamination: 0 }],
    photos: [] as string[],
    location: { lat: 0, lng: 0 },
    scheduledDate: '',
    estimatedWeight: 0
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadPickupsData();
    }
  }, [user]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  // Redirect non-collectors to unauthorized page
  useEffect(() => {
    if (user && user.role && 
        user.role !== 'collector' && user.role !== 'admin' &&
        user.role !== 'COLLECTOR' && user.role !== 'ADMIN') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadPickupsData = async () => {
    try {
      setIsLoading(true);
      
      if (!user) return;
      
      // Get real pickups data from Supabase
      const { data: pickupsData, error } = await supabase
        .from('pickups')
        .select(`
          *,
          customer:profiles!pickups_customer_id_fkey(first_name, last_name, email, phone),
          address:addresses(line1, suburb, city, postal_code),
          pickup_items(material_id, kilograms)
        `)
        .eq('collector_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickups:', error);
        return;
      }

      // Transform real data to match expected structure
      const transformedPickups = (pickupsData || []).map((pickup: any) => {
        const customer = pickup.customer as any;
        const address = pickup.address as any;
        const pickupItems = pickup.pickup_items as any[] || [];
        
        // Calculate environmental impact (simplified calculations)
        const totalKg = pickup.total_kg || 0;
        const co2_saved = totalKg * 0.5; // 0.5 kg CO2 saved per kg recycled
        const water_saved = totalKg * 3.5; // 3.5 liters water saved per kg recycled
        const landfill_saved = totalKg;
        const trees_equivalent = totalKg * 0.045; // 0.045 trees equivalent per kg
        
        // Calculate fund allocation (70% to user wallet, 30% to green fund)
        const totalValue = totalKg * 5; // R5 per kg
        const green_scholar_fund = totalValue * 0.3;
        const user_wallet = totalValue * 0.7;
        
        // Calculate points (6 points per kg)
        const total_points = totalKg * 6;
        
        // Transform materials breakdown
        const materials_breakdown = pickupItems.map(item => {
          const materialKg = item.kilograms || 0;
          const rate_per_kg = 2.0; // Default rate
          const value = materialKg * rate_per_kg;
          const points = materialKg * 6;
          
          return {
            material_name: 'Mixed Materials', // TODO: Get from materials table
            weight_kg: materialKg,
            rate_per_kg,
            value,
            points,
            impact: {
              co2_saved: materialKg * 0.5,
              water_saved: materialKg * 3.5,
              landfill_saved: materialKg,
              trees_equivalent: materialKg * 0.045
            }
          };
        });

        return {
          pickup_id: pickup.id,
          status: pickup.status,
          started_at: pickup.started_at || pickup.created_at,
          total_kg: totalKg,
          total_value: totalValue,
          customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Unknown Customer',
          customer_email: customer?.email || 'No email',
          customer_phone: customer?.phone || 'No phone',
          line1: address?.line1 || 'No address',
          suburb: address?.suburb || '',
          city: address?.city || '',
          postal_code: address?.postal_code || '',
          environmental_impact: {
            co2_saved,
            water_saved,
            landfill_saved,
            trees_equivalent
          },
          fund_allocation: {
            green_scholar_fund,
            user_wallet,
            total_value: totalValue
          },
          total_points,
          materials_breakdown,
          photo_count: 0 // TODO: Get from pickup_photos table
        };
      });

      setPickups(transformedPickups);
    } catch (error) {
      console.error('Error loading pickups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePickup = async () => {
    // Implementation for creating pickup
    console.log('Creating pickup:', newPickupForm);
    setIsNewPickupOpen(false);
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
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Pickups</h1>
            <p className="text-gray-300">Manage your collection pickups</p>
          </div>
        </div>
        
        <Dialog open={isNewPickupOpen} onOpenChange={setIsNewPickupOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg">
              <Plus className="h-4 w-4" />
              New Pickup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Create New Collection Pickup</DialogTitle>
              <DialogDescription className="text-gray-300">
                Document a new collection with photos, materials, and details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Customer & Location Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId" className="text-gray-300">Customer</Label>
                  <Select value={newPickupForm.customerId} onValueChange={(value) => setNewPickupForm(prev => ({ ...prev, customerId: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="1">John Doe - 123 Main St</SelectItem>
                      <SelectItem value="2">Jane Smith - 456 Oak Ave</SelectItem>
                      <SelectItem value="3">Bob Johnson - 789 Pine Rd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="scheduledDate" className="text-gray-300">Scheduled Date</Label>
                  <Input 
                    type="date" 
                    id="scheduledDate"
                    value={newPickupForm.scheduledDate}
                    onChange={(e) => setNewPickupForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Photo Documentation Section */}
              <div>
                <Label className="text-base font-medium text-white">Photo Documentation</Label>
                <p className="text-sm text-gray-300 mb-3">
                  Take photos of the materials being collected
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {capturedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={photo} 
                        alt={`Collection photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => setCapturedPhotos(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors bg-gray-700"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium text-white">Materials Collected</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPickupForm(prev => ({
                      ...prev,
                      materials: [...prev.materials, { materialId: '', kg: 0, contamination: 0 }]
                    }))}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Material
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newPickupForm.materials.map((material, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-600 rounded-lg bg-gray-700">
                      <div>
                        <Label className="text-gray-300">Material Type</Label>
                        <Select 
                          value={material.materialId} 
                          onValueChange={(value) => {
                            const updatedMaterials = [...newPickupForm.materials];
                            updatedMaterials[index].materialId = value;
                            setNewPickupForm(prev => ({ ...prev, materials: updatedMaterials }));
                          }}
                        >
                          <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-600 border-gray-500">
                            <SelectItem value="paper">Paper & Cardboard</SelectItem>
                            <SelectItem value="plastic">Plastic</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="metal">Metal</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="organic">Organic Waste</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={material.kg}
                          onChange={(e) => {
                            const updatedMaterials = [...newPickupForm.materials];
                            updatedMaterials[index].kg = parseFloat(e.target.value) || 0;
                            setNewPickupForm(prev => ({ ...prev, materials: updatedMaterials }));
                          }}
                          placeholder="0.0"
                          className="bg-gray-600 border-gray-500 text-white"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Contamination (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={material.contamination}
                          onChange={(e) => {
                            const updatedMaterials = [...newPickupForm.materials];
                            updatedMaterials[index].contamination = parseInt(e.target.value) || 0;
                            setNewPickupForm(prev => ({ ...prev, materials: updatedMaterials }));
                          }}
                          placeholder="0"
                          className="bg-gray-600 border-gray-500 text-white"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedMaterials = newPickupForm.materials.filter((_, i) => i !== index);
                            setNewPickupForm(prev => ({ ...prev, materials: updatedMaterials }));
                          }}
                          className="w-full border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedWeight" className="text-gray-300">Estimated Total Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="estimatedWeight"
                    value={newPickupForm.estimatedWeight}
                    onChange={(e) => setNewPickupForm(prev => ({ ...prev, estimatedWeight: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.0"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => {
                      // Get current location
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((position) => {
                          setNewPickupForm(prev => ({
                            ...prev,
                            location: {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            }
                          }));
                        });
                      }
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {newPickupForm.location.lat ? 'Location Captured' : 'Capture Location'}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
                <Textarea 
                  id="notes"
                  value={newPickupForm.notes}
                  onChange={(e) => setNewPickupForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions, customer requests, or additional details..."
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                <Button variant="outline" onClick={() => setIsNewPickupOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={handleCreatePickup} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                  <Package className="h-4 w-4" />
                  Create Collection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pickups List */}
      <div className="grid gap-4">
        {pickups.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No pickups yet</h3>
              <p className="text-gray-300 text-center mb-4">
                Create your first pickup to start collecting recyclables
              </p>
              <Button onClick={() => setIsNewPickupOpen(true)} className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Pickup
              </Button>
            </CardContent>
          </Card>
        ) : (
          pickups.map((pickup) => (
            <Card key={pickup.pickup_id} className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <MapPin className="h-4 w-4 text-orange-400" />
                      Pickup #{pickup.pickup_id}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {pickup.customer_name} • {pickup.line1}, {pickup.suburb}, {pickup.city}
                    </CardDescription>
                  </div>
                  <Badge variant={pickup.status === 'completed' ? 'default' : 'secondary'} className="bg-orange-500 text-white">
                    {pickup.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-300">Date:</span> {pickup.started_at}
                  </div>
                  <div>
                    <span className="font-medium text-gray-300">Materials:</span> {pickup.materials_breakdown.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile Optimized - DARK GREY + ORANGE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </Link>

          {/* Pickups Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-orange-500 text-white">
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </div>

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
