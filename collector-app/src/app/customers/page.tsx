"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2,
  Users,
  Package,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  Scale,
  Save
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { profileServices, addressServices, materialServices, pickupServices, pickupItemServices } from "@/lib/supabase-services";
import type { ProfileWithAddresses, Material } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

// Extended customer interface for Supabase data
interface CustomerWithStats extends ProfileWithAddresses {
  name: string;
  address: string;
  city: string;
  totalCollections: number;
  totalKg: number;
  lastCollection: string;
}

interface NewCustomerForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
  postalCode: string;
}

interface AddressForm {
  customerId: string;
  customerName: string;
  line1: string;
  suburb: string;
  city: string;
  postalCode: string;
  isPrimary: boolean;
}

interface CollectionForm {
  customerId: string;
  customerName: string;
  addressId: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    kilograms: number;
  }>;
}

export default function CollectorCustomersPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    city: '',
    postalCode: ''
  });

  const [addressForm, setAddressForm] = useState<AddressForm>({
    customerId: '',
    customerName: '',
    line1: '',
    suburb: '',
    city: '',
    postalCode: '',
    isPrimary: true
  });
  const [collectionForm, setCollectionForm] = useState<CollectionForm>({
    customerId: '',
    customerName: '',
    addressId: '',
    materials: []
  });

  useEffect(() => {
    if (user) {
      loadCustomersData();
      loadMaterials();
    }
  }, [user]);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
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
    if (user && user.role && 
        user.role !== 'collector' && user.role !== 'admin' &&
        user.role !== 'COLLECTOR' && user.role !== 'ADMIN') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadCustomersData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real customer data from Supabase
      const customerProfiles = await profileServices.getCustomerProfilesWithAddresses();
      
      // Transform the data to include stats (you can enhance this with actual pickup data later)
      const customersWithStats: CustomerWithStats[] = customerProfiles.map(profile => {
        const primaryAddress = profile.addresses?.find(addr => addr.is_primary) || profile.addresses?.[0];
        
        console.log(`Customer ${profile.id} addresses:`, profile.addresses);
        console.log(`Primary address for ${profile.id}:`, primaryAddress);
        
        return {
          ...profile,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Unknown Customer',
          address: primaryAddress ? `${primaryAddress.line1}, ${primaryAddress.suburb}` : 'No address',
          city: primaryAddress?.city || 'Unknown',
          totalCollections: 0, // TODO: Calculate from actual pickup data
          totalKg: 0, // TODO: Calculate from actual pickup data
          lastCollection: 'Never' // TODO: Get from actual pickup data
        };
      });
      
      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const activeMaterials = await materialServices.getActiveMaterials();
      setMaterials(activeMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      console.log('Current user:', user);
      console.log('Current customers:', customers);
      
      // Test if pickups table exists and is accessible
      const { data: pickupsTest, error: pickupsError } = await supabase
        .from('pickups')
        .select('id')
        .limit(1);
      
      console.log('Pickups table test:', { data: pickupsTest, error: pickupsError });
      
      // Test if pickup_items table exists and is accessible
      const { data: itemsTest, error: itemsError } = await supabase
        .from('pickup_items')
        .select('id')
        .limit(1);
      
      console.log('Pickup items table test:', { data: itemsTest, error: itemsError });
      
      // Test if materials table exists and is accessible
      const { data: materialsTest, error: materialsError } = await supabase
        .from('materials')
        .select('id')
        .limit(1);
      
      console.log('Materials table test:', { data: materialsTest, error: materialsError });
      
    } catch (error) {
      console.error('Database connection test failed:', error);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      setIsCreatingCustomer(true);
      
      // Create new customer profile
      const newProfile = await profileServices.upsertProfile({
        email: newCustomerForm.email,
        username: `${newCustomerForm.firstName}_${newCustomerForm.lastName}`.toLowerCase().replace(/\s+/g, '_'),
        first_name: newCustomerForm.firstName,
        last_name: newCustomerForm.lastName,
        phone: newCustomerForm.phone,
        role: 'customer',
        is_active: true
      });

      if (newProfile) {
        // Create address for the new customer
        await addressServices.createAddress({
          profile_id: newProfile.id,
          line1: newCustomerForm.address,
          suburb: newCustomerForm.city,
          city: newCustomerForm.city,
          postal_code: newCustomerForm.postalCode,
          is_primary: true
        });

        // Reload customers data
        await loadCustomersData();
        
        // Reset form and close dialog
        setNewCustomerForm({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          suburb: '',
          postalCode: ''
        });
        setIsNewCustomerOpen(false);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const openCollectionDialog = (customer: CustomerWithStats) => {
    const primaryAddress = customer.addresses?.find(addr => addr.is_primary) || customer.addresses?.[0];
    
    // Validate that we have the required IDs
    if (!customer.id) {
      alert('Customer ID is missing. Please try again.');
      return;
    }
    
    if (!primaryAddress?.id) {
      alert('Customer address is missing. Please add an address for this customer first.');
      return;
    }
    
    console.log('Opening collection dialog for:', {
      customerId: customer.id,
      customerName: customer.name,
      addressId: primaryAddress.id
    });
    
    setCollectionForm({
      customerId: customer.id,
      customerName: customer.name,
      addressId: primaryAddress.id,
      materials: materials.map(material => ({
        materialId: material.id,
        materialName: material.name,
        kilograms: 0
      }))
    });
    setIsCollectionOpen(true);
  };

  const openAddAddressDialog = (customer: CustomerWithStats) => {
    setAddressForm({
      customerId: customer.id,
      customerName: customer.name,
      line1: '',
      suburb: '',
      city: '',
      postalCode: '',
      isPrimary: true
    });
    setIsAddAddressOpen(true);
  };

  const handleSaveCollection = async () => {
    try {
      setIsSavingCollection(true);
      
      // Validate required fields
      if (!user?.id) {
        alert('User ID is missing. Please log in again.');
        return;
      }
      
      if (!collectionForm.customerId) {
        alert('Customer ID is missing. Please try again.');
        return;
      }
      
      if (!collectionForm.addressId) {
        alert('Address ID is missing. Please try again.');
        return;
      }
      
      // Filter out materials with 0 kg
      const validMaterials = collectionForm.materials.filter(m => m.kilograms > 0);
      
      if (validMaterials.length === 0) {
        alert('Please enter at least one material with weight greater than 0 kg');
        return;
      }

      console.log('Creating pickup with data:', {
        customer_id: collectionForm.customerId,
        collector_id: user.id,
        address_id: collectionForm.addressId,
        status: 'submitted'
      });

      // Create pickup
      const pickup = await pickupServices.createPickup({
        customer_id: collectionForm.customerId,
        collector_id: user.id,
        address_id: collectionForm.addressId,
        status: 'submitted'
      });

      if (pickup) {
        // Create pickup items for each material with weight
        const pickupItems = validMaterials.map(material => ({
          pickup_id: pickup.id,
          material_id: material.materialId,
          kilograms: material.kilograms
        }));
        
        await pickupItemServices.addPickupItems(pickup.id, pickupItems);

        // Close dialog and reload data
        setIsCollectionOpen(false);
        await loadCustomersData();
        
        // Reset form
        setCollectionForm({
          customerId: '',
          customerName: '',
          addressId: '',
          materials: []
        });
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Error saving collection. Please try again.');
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      setIsSavingAddress(true);
      
      // Validate required fields
      if (!addressForm.customerId) {
        alert('Customer ID is missing. Please try again.');
        return;
      }
      
      if (!addressForm.line1 || !addressForm.suburb || !addressForm.city) {
        alert('Please fill in all required address fields.');
        return;
      }
      
      // Create the address
      const newAddress = await addressServices.createAddress({
        profile_id: addressForm.customerId,
        line1: addressForm.line1,
        suburb: addressForm.suburb,
        city: addressForm.city,
        postal_code: addressForm.postalCode,
        is_primary: addressForm.isPrimary
      });
      
      if (newAddress) {
        // Close dialog and reload data
        setIsAddAddressOpen(false);
        await loadCustomersData();
        
        // Reset form
        setAddressForm({
          customerId: '',
          customerName: '',
          line1: '',
          suburb: '',
          city: '',
          postalCode: '',
          isPrimary: true
        });
        
        alert('Address added successfully!');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const updateMaterialWeight = (materialId: string, kilograms: number) => {
    setCollectionForm(prev => ({
      ...prev,
      materials: prev.materials.map(m => 
        m.materialId === materialId ? { ...m, kilograms } : m
      )
    }));
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
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-gray-300">Manage your customer relationships</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={testDatabaseConnection}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Test DB
          </Button>
          
          <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg">
                <Plus className="h-4 w-4" />
                New Customer
              </Button>
            </DialogTrigger>
          
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription className="text-gray-300">
                Add a new customer to your collection route
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input 
                    id="name"
                    value={newCustomerForm.firstName}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter full name"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input 
                  id="phone"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="text-gray-300">Street Address</Label>
                <Input 
                  id="address"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter street address"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-gray-300">City</Label>
                  <Input 
                    id="city"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                          <Label htmlFor="suburb" className="text-gray-300">Suburb</Label>
        <Input
          id="suburb"
          value={newCustomerForm.suburb}
          onChange={(e) => setNewCustomerForm(prev => ({ ...prev, suburb: e.target.value }))}
          placeholder="Enter suburb"
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        />

                </div>
                
                <div>
                  <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                  <Input 
                    id="postalCode"
                    value={newCustomerForm.postalCode}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal Code"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsNewCustomerOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCustomer}
                disabled={isCreatingCustomer}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                {isCreatingCustomer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Customer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search customers by name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pl-10"
          />
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.length === 0 ? (
          <Card className="col-span-full bg-gray-800 border-gray-700 text-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No customers found</h3>
              <p className="text-gray-400 text-center">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first customer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Users className="h-4 w-4 text-orange-400" />
                      {customer.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 text-gray-300">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {customer.totalCollections} collections
                    </Badge>
                    <div className="text-sm text-gray-400">
                      {customer.totalKg} kg total
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-orange-400" />
                    <span className="text-gray-300">{customer.address}, {customer.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-yellow-400" />
                    <span className="text-gray-300">Last: {customer.lastCollection}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  {customer.addresses && customer.addresses.length > 0 ? (
                    <Button 
                      onClick={() => openCollectionDialog(customer)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Record Collection
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => openAddAddressDialog(customer)}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Add Address First
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Collection Dialog */}
      <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
        <DialogContent className="max-w-2xl bg-gray-800 border-gray-600 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-green-400" />
              Record Collection
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Record the materials collected from {collectionForm.customerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Customer Details</h4>
              <p className="text-gray-300">{collectionForm.customerName}</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Materials Collected</h4>
              {collectionForm.materials.map((material) => (
                <div key={material.materialId} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-gray-300">{material.materialName}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={material.kilograms}
                      onChange={(e) => updateMaterialWeight(material.materialId, parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="w-24 bg-gray-600 border-gray-500 text-white text-center"
                    />
                    <span className="text-gray-300 text-sm">kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCollectionOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCollection}
              disabled={isSavingCollection}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {isSavingCollection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
        <DialogContent className="max-w-md bg-gray-800 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-400" />
              Add Address for {addressForm.customerName}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Add a pickup address for this customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="line1" className="text-gray-300">Street Address</Label>
              <Input
                id="line1"
                value={addressForm.line1}
                onChange={(e) => setAddressForm(prev => ({ ...prev, line1: e.target.value }))}
                placeholder="Enter street address"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="suburb" className="text-gray-300">Suburb</Label>
              <Input
                id="suburb"
                value={addressForm.suburb}
                onChange={(e) => setAddressForm(prev => ({ ...prev, suburb: e.target.value }))}
                placeholder="Enter suburb"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="city" className="text-gray-300">City</Label>
              <Input
                id="city"
                value={addressForm.city}
                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter city"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
              <Input
                id="postalCode"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                placeholder="Enter postal code"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={addressForm.isPrimary}
                onChange={(e) => setAddressForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="isPrimary" className="text-gray-300">Set as primary address</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddAddressOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAddress}
              disabled={isSavingAddress}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              {isSavingAddress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Address
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <Link
            href="/pickups"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </Link>

          {/* Customers Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-orange-500 text-white">
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Customers</span>
          </div>

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
