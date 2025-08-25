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
  TrendingUp
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { PickupService, type CreatePickupData } from "@/lib/pickup-service";
import type { CollectorDashboardView, Material } from "@/lib/supabase";
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
    if (user && user.role && user.role !== 'COLLECTOR') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadPickupsData = async () => {
    try {
      setIsLoading(true);
      // Mock data for now
      const mockPickups = [
        {
          pickup_id: '1',
          status: 'completed',
          started_at: '2024-01-15T10:00:00Z',
          total_kg: 25.5,
          total_value: 45.50,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+27 123 456 789',
          line1: '123 Main St',
          suburb: 'City Center',
          city: 'Cape Town',
          postal_code: '8001',
          environmental_impact: {
            co2_saved: 12.75,
            water_saved: 89.25,
            landfill_saved: 25.5,
            trees_equivalent: 1.16
          },
          fund_allocation: {
            green_scholar_fund: 13.65,
            user_wallet: 31.85,
            total_value: 45.50
          },
          total_points: 150,
          materials_breakdown: [
            {
              material_name: 'Paper & Cardboard',
              weight_kg: 15.0,
              rate_per_kg: 1.20,
              value: 18.00,
              points: 90,
              impact: {
                co2_saved: 7.5,
                water_saved: 52.5,
                landfill_saved: 15.0,
                trees_equivalent: 0.68
              }
            },
            {
              material_name: 'Plastic',
              weight_kg: 8.5,
              rate_per_kg: 2.50,
              value: 21.25,
              points: 42.5,
              impact: {
                co2_saved: 4.25,
                water_saved: 29.75,
                landfill_saved: 8.5,
                trees_equivalent: 0.39
              }
            },
            {
              material_name: 'Glass',
              weight_kg: 2.0,
              rate_per_kg: 3.10,
              value: 6.20,
              points: 17.5,
              impact: {
                co2_saved: 1.0,
                water_saved: 7.0,
                landfill_saved: 2.0,
                trees_equivalent: 0.09
              }
            }
          ],
          photo_count: 3
        }
      ];
      setPickups(mockPickups);
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Pickups</h1>
            <p className="text-muted-foreground">Manage your collection pickups</p>
          </div>
        </div>
        
        <Dialog open={isNewPickupOpen} onOpenChange={setIsNewPickupOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Pickup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Collection Pickup</DialogTitle>
              <DialogDescription>
                Document a new collection with photos, materials, and details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Customer & Location Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <Select value={newPickupForm.customerId} onValueChange={(value) => setNewPickupForm(prev => ({ ...prev, customerId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe - 123 Main St</SelectItem>
                      <SelectItem value="2">Jane Smith - 456 Oak Ave</SelectItem>
                      <SelectItem value="3">Bob Johnson - 789 Pine Rd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input 
                    type="date" 
                    id="scheduledDate"
                    value={newPickupForm.scheduledDate}
                    onChange={(e) => setNewPickupForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Photo Documentation Section */}
              <div>
                <Label className="text-base font-medium">Photo Documentation</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Take photos of the materials being collected
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {capturedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={photo} 
                        alt={`Collection photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
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
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Materials Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium">Materials Collected</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPickupForm(prev => ({
                      ...prev,
                      materials: [...prev.materials, { materialId: '', kg: 0, contamination: 0 }]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Material
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newPickupForm.materials.map((material, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                      <div>
                        <Label>Material Type</Label>
                        <Select 
                          value={material.materialId} 
                          onValueChange={(value) => {
                            const updatedMaterials = [...newPickupForm.materials];
                            updatedMaterials[index].materialId = value;
                            setNewPickupForm(prev => ({ ...prev, materials: updatedMaterials }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label>Weight (kg)</Label>
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
                        />
                      </div>
                      
                      <div>
                        <Label>Contamination (%)</Label>
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
                          className="w-full"
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
                  <Label htmlFor="estimatedWeight">Estimated Total Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    id="estimatedWeight"
                    value={newPickupForm.estimatedWeight}
                    onChange={(e) => setNewPickupForm(prev => ({ ...prev, estimatedWeight: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
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
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes"
                  value={newPickupForm.notes}
                  onChange={(e) => setNewPickupForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions, customer requests, or additional details..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsNewPickupOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePickup} className="flex items-center gap-2">
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pickups yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first pickup to start collecting recyclables
              </p>
              <Button onClick={() => setIsNewPickupOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Pickup
              </Button>
            </CardContent>
          </Card>
        ) : (
          pickups.map((pickup) => (
            <Card key={pickup.pickup_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Pickup #{pickup.pickup_id}
                    </CardTitle>
                    <CardDescription>
                      {pickup.customer_name} • {pickup.line1}, {pickup.suburb}, {pickup.city}
                    </CardDescription>
                  </div>
                  <Badge variant={pickup.status === 'completed' ? 'default' : 'secondary'}>
                    {pickup.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {pickup.started_at}
                  </div>
                  <div>
                    <span className="font-medium">Materials:</span> {pickup.materials_breakdown.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile Optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </Link>

          {/* Pickups Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </div>

          {/* Customers Tab */}
          <Link
            href="/customers"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Customers</span>
          </Link>

          {/* Analytics Tab */}
          <Link
            href="/analytics"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <TrendingUp className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
