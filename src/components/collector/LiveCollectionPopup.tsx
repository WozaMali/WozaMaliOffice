'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Scale, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  X,
  Loader2
} from 'lucide-react';
import { searchCustomersByAddress, searchCustomersComprehensive, CustomerSearchResult } from '../../lib/customer-services';
import { submitLiveCollection, CollectionMaterial } from '../../lib/collection-services';
import { getMaterialId } from '../../lib/material-services';
import { supabase } from '@/lib/supabase';

interface Material {
  id: string;
  name: string;
  kilograms: number;
  contamination_pct: number;
  rate_per_kg: number;
  isDonation?: boolean;
  material_id?: string; // Database material ID
  notes?: string; // Add missing notes property
}

interface LiveCollectionData {
  address: string;
  customerName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LiveCollectionData;
}

export default function LiveCollectionPopup({ isOpen, onClose, initialData }: Props) {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    address: initialData?.address || '',
    notes: ''
  });

  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [scalePhoto, setScalePhoto] = useState<string | null>(null);
  const [recyclablesPhoto, setRecyclablesPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear search results when popup closes
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setSearchError(null);
      setSelectedCustomer(null);
    }
  }, [isOpen]);

  const SAMPLE_MATERIALS = [
    { id: '1', name: 'Aluminium', rate_per_kg: 18.55, isDonation: false },
    { id: '2', name: 'PET', rate_per_kg: 1.50, isDonation: true },
    { id: '3', name: 'Glass', rate_per_kg: 2.00, isDonation: false },
    { id: '4', name: 'Paper', rate_per_kg: 1.20, isDonation: false },
    { id: '5', name: 'Cardboard', rate_per_kg: 1.00, isDonation: false },
  ];

  const searchCustomersByAddressHandler = async () => {
    if (!formData.address.trim()) {
      setSearchError('Please enter an address to search');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      console.log('🔍 Searching for customers at address:', formData.address);
      
      const results = await searchCustomersByAddress(formData.address);
      setSearchResults(results);
      
      if (results.length === 0) {
        setSearchError('No customers found at this address');
      } else {
        console.log(`✅ Found ${results.length} customers at address`);
      }
    } catch (error: any) {
      console.error('❌ Error searching customers:', error);
      setSearchError(error.message || 'Failed to search customers');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: customer.full_name
    }));
    setSearchResults([]);
    setSearchError(null);
    console.log('✅ Customer selected:', customer.full_name);
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      name: '',
      kilograms: 0,
      contamination_pct: 0,
      rate_per_kg: 0
    };
    setMaterials([...materials, newMaterial]);
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof Material, value: any) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const calculateTotals = () => {
    let totalValue = 0;
    let donationValue = 0;

    materials.forEach(material => {
      const materialInfo = SAMPLE_MATERIALS.find(m => m.name === material.name);
      if (materialInfo) {
        const value = material.kilograms * materialInfo.rate_per_kg;
        if (materialInfo.isDonation) {
          donationValue += value;
        } else {
          totalValue += value;
        }
      }
    });

    return { totalValue, donationValue };
  };

  const capturePhoto = (type: 'scale' | 'recyclables') => {
    // Simulate photo capture - in real app, this would use camera API
    const photoUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#f3f4f6"/>
        <text x="100" y="75" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">
          ${type === 'scale' ? 'Scale Photo' : 'Recyclables Photo'}
        </text>
        <text x="100" y="95" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="12">
          Captured at ${new Date().toLocaleTimeString()}
        </text>
      </svg>
    `)}`;

    if (type === 'scale') {
      setScalePhoto(photoUrl);
    } else {
      setRecyclablesPhoto(photoUrl);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    if (materials.length === 0) {
      alert('Please add at least one material');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting live collection to database...');

      // Get current user (collector) ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Collector not authenticated. Please log in again.');
      }

      // Prepare materials with database IDs
      const collectionMaterials: CollectionMaterial[] = [];
      for (const material of materials) {
        if (material.name && material.kilograms > 0) {
          const materialId = await getMaterialId(material.name);
          if (!materialId) {
            throw new Error(`Material "${material.name}" not found in database. Please contact admin.`);
          }

          collectionMaterials.push({
            material_id: materialId,
            kilograms: material.kilograms,
            contamination_pct: material.contamination_pct,
            notes: material.notes || undefined
          });
        }
      }

      if (collectionMaterials.length === 0) {
        throw new Error('No valid materials to submit. Please check material names and weights.');
      }

      // Submit the collection
      const result = await submitLiveCollection({
        customer_id: selectedCustomer.profile_id,
        materials: collectionMaterials,
        notes: formData.notes,
        scale_photo: scalePhoto || undefined,
        recyclables_photo: recyclablesPhoto || undefined
      }, user.id);

      // Show success message with details
      const successMessage = `🎉 Collection submitted successfully!
      
📊 Collection Summary:
• Total Weight: ${result.total_kg}kg
• Total Value: R${result.total_value.toFixed(2)}
• Points Earned: ${result.points_earned}
• CO2 Saved: ${result.environmental_impact.co2_saved}kg
• Water Saved: ${result.environmental_impact.water_saved}L
• Trees Equivalent: ${result.environmental_impact.trees_equivalent}

💰 Fund Allocation:
• Green Scholar Fund: R${result.fund_allocation.green_scholar_fund.toFixed(2)}
  - PET/Plastic: 100% to Green Scholar Fund
  - Other materials: 70% to Green Scholar Fund
• Customer Wallet: R${result.fund_allocation.user_wallet.toFixed(2)}
  - Aluminium: 100% to Customer Wallet
  - Other materials: 30% to Customer Wallet

🌱 Environmental Impact:
• CO2 emissions reduced by ${result.environmental_impact.co2_saved}kg
• Water consumption reduced by ${result.environmental_impact.water_saved}L
• Equivalent to planting ${result.environmental_impact.trees_equivalent} trees!`;

      console.log('🔄 Resetting form state and closing popup...');
      
      // Reset form state first
      setFormData({
        customerName: '',
        address: '',
        notes: ''
      });
      setMaterials([]);
      setSelectedCustomer(null);
      setSearchResults([]);
      setSearchError(null);
      setScalePhoto(null);
      setRecyclablesPhoto(null);
      
      // Close the popup immediately
      console.log('🔄 Calling onClose()...');
      onClose();
      
      // Add additional close attempts with delays
      setTimeout(() => {
        console.log('🔄 Second close attempt...');
        onClose();
      }, 200);
      
      setTimeout(() => {
        console.log('🔄 Third close attempt...');
        onClose();
      }, 500);
      
      // Show success message after popup is closed
      setTimeout(() => {
        console.log('✅ Collection submitted successfully!');
        console.log('📊 Collection Summary:', {
          total_kg: result.total_kg,
          total_value: result.total_value,
          points_earned: result.points_earned,
          environmental_impact: result.environmental_impact,
          fund_allocation: result.fund_allocation
        });
      }, 100);
    } catch (error: any) {
      console.error('❌ Error submitting collection:', error);
      alert(`Failed to submit collection: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const { totalValue, donationValue } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Collection</h2>
              <p className="text-gray-600">Record a new collection in real-time</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer & Address */}
            <div className="space-y-6">
              {/* Customer Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Find Customer by Address
                  </CardTitle>
                  <CardDescription>Search for existing customers at this address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="address"
                        placeholder="Enter address to search"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                      <Button 
                        onClick={searchCustomersByAddressHandler}
                        disabled={isSearching}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Show All Customers Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        try {
                          setIsSearching(true);
                          setSearchError(null);
                          console.log('🔍 Loading all customers...');
                          
                          // Use comprehensive search with empty term to get all customers
                          const results = await searchCustomersComprehensive('');
                          setSearchResults(results);
                          
                          if (results.length === 0) {
                            setSearchError('No customers found in the system');
                          } else {
                            console.log(`✅ Loaded ${results.length} customers`);
                          }
                        } catch (error: any) {
                          console.error('❌ Error loading all customers:', error);
                          setSearchError(error.message || 'Failed to load customers');
                          setSearchResults([]);
                        } finally {
                          setIsSearching(false);
                        }
                      }}
                      className="mt-2 text-xs"
                    >
                      Show All Customers
                    </Button>
                    
                    {/* Debug button to check database state */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        try {
                          console.log('🔍 Debug: Checking database state...');
                          
                          // Check if we can access profiles table
                          const { data: profiles, error: profilesError } = await supabase
                            .from('profiles')
                            .select('id, full_name, role, is_active')
                            .eq('role', 'customer')
                            .eq('is_active', true)
                            .limit(5);
                          
                          console.log('🔍 Profiles check:', { data: profiles, error: profilesError });
                          
                          // Check if we can access addresses table
                          const { data: addresses, error: addressesError } = await supabase
                            .from('addresses')
                            .select('id, profile_id, line1, suburb, city')
                            .limit(5);
                          
                          console.log('🔍 Addresses check:', { data: addresses, error: addressesError });
                          
                          // Check the relationship
                          if (profiles && addresses && profiles.length > 0 && addresses.length > 0) {
                            const { data: testJoin, error: joinError } = await supabase
                              .from('addresses')
                              .select(`
                                id,
                                profile_id,
                                line1,
                                suburb,
                                city,
                                profiles!inner(id, full_name)
                              `)
                              .limit(1);
                            
                            console.log('🔍 Join test:', { data: testJoin, error: joinError });
                          }
                          
                          alert('Check console for database debug info');
                        } catch (error) {
                          console.error('❌ Debug error:', error);
                          alert('Debug failed - check console');
                        }
                      }}
                      className="mt-2 text-xs ml-2"
                    >
                      Debug DB State
                    </Button>
                  </div>

                  {/* Search Results */}
                  {searchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{searchError}</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {isSearching && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <p className="text-blue-700 text-sm">Searching for customers...</p>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Found Customers:</p>
                      {searchResults.map((customer) => (
                        <div 
                          key={customer.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={() => selectCustomer(customer)}
                        >
                          <p className="font-medium text-gray-900">{customer.full_name}</p>
                          <p className="text-sm text-gray-600">{customer.address}</p>
                          {customer.phone && (
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results Message */}
                  {!isSearching && searchResults.length === 0 && !searchError && formData.address.trim() && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-sm">No customers found. Try searching with a different term or click "Show All Customers".</p>
                    </div>
                  )}

                  {/* Selected Customer */}
                  {selectedCustomer && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="font-medium text-green-800">Customer Selected</p>
                      </div>
                      <p className="text-green-700">{selectedCustomer.full_name}</p>
                      <p className="text-sm text-green-600">{selectedCustomer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Customer Entry */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                  <CardDescription>Enter customer information manually</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer name"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this collection"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Materials & Photos */}
            <div className="space-y-6">
              {/* Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Materials Collected
                  </CardTitle>
                  <CardDescription>Add materials and their weights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {materials.map((material, index) => (
                    <div key={material.id} className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label>Material</Label>
                        <select
                          value={material.name}
                          onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select material</option>
                          {SAMPLE_MATERIALS.map(m => (
                            <option key={m.id} value={m.name}>
                              {m.name} - R{m.rate_per_kg}/kg
                              {m.isDonation ? ' (Donation)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Kg</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={material.kilograms}
                          onChange={(e) => updateMaterial(material.id, 'kilograms', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Contamination %</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0"
                          value={material.contamination_pct}
                          onChange={(e) => updateMaterial(material.id, 'contamination_pct', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(material.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button onClick={addMaterial} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Material
                  </Button>
                </CardContent>
              </Card>

              {/* Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photo Documentation
                  </CardTitle>
                  <CardDescription>Capture photos of the scale and recyclables</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Photo of Scale</Label>
                      <div className="mt-1">
                        {scalePhoto ? (
                          <div className="relative">
                            <img src={scalePhoto} alt="Scale" className="w-full h-32 object-cover rounded-lg" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setScalePhoto(null)}
                              className="absolute top-2 right-2 bg-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => capturePhoto('scale')}
                            variant="outline"
                            className="w-full h-32 border-dashed border-2 border-gray-300 hover:border-gray-400"
                          >
                            <Camera className="w-8 h-8 text-gray-400" />
                            <span className="block mt-2 text-sm text-gray-500">Capture Scale Photo</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Photo of Recyclables</Label>
                      <div className="mt-1">
                        {recyclablesPhoto ? (
                          <div className="relative">
                            <img src={recyclablesPhoto} alt="Recyclables" className="w-full h-32 object-cover rounded-lg" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRecyclablesPhoto(null)}
                              className="absolute top-2 right-2 bg-white"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => capturePhoto('recyclables')}
                            variant="outline"
                            className="w-full h-32 border-dashed border-2 border-gray-300 hover:border-gray-400"
                          >
                            <Camera className="w-8 h-8 text-gray-400" />
                            <span className="block mt-2 text-sm text-gray-500">Capture Recyclables Photo</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Collection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{materials.length}</p>
                      <p className="text-sm text-gray-600">Materials</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {materials.reduce((sum, m) => sum + m.kilograms, 0).toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">Total Kg</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">R {totalValue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Customer Value</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">R {donationValue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Donation Value</p>
                    </div>
                  </div>
                  
                                     <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                     <p className="text-sm text-orange-800">
                       <strong>Fund Allocation:</strong><br/>
                       • Aluminium (R18.55/kg): 100% to Customer Wallet<br/>
                       • PET/Plastic (R1.50/kg): 100% to Green Scholar Fund<br/>
                       • Other materials: 70% Green Scholar Fund, 30% Customer Wallet
                     </p>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedCustomer || materials.length === 0 || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Submit Collection
            </Button>
          </div>
          
          {/* Note about submission requirements */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Ready to Submit:</strong> You can submit a collection once you've selected a customer and added at least one material. 
              Photos are optional and not required for submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

