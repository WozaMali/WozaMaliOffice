"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2,
  Users,
  Package,
  Star,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Define proper interfaces instead of 'any'
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalCollections: number;
  totalKg: number;
  lastCollection: string; // Added for the last collection date
}

interface NewCustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export default function CollectorCustomersPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  useEffect(() => {
    if (user) {
      loadCustomersData();
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

  const loadCustomersData = async () => {
    try {
      setIsLoading(true);
      // Mock data for now
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+27 123 456 789',
          address: '123 Main St',
          city: 'Cape Town',
          totalCollections: 15,
          totalKg: 125.5,
          lastCollection: '2023-10-20'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+27 987 654 321',
          address: '456 Oak Ave',
          city: 'Johannesburg',
          totalCollections: 8,
          totalKg: 67.2,
          lastCollection: '2023-10-18'
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          phone: '+27 555 123 456',
          address: '789 Pine Rd',
          city: 'Durban',
          totalCollections: 12,
          totalKg: 89.1,
          lastCollection: '2023-10-15'
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    // Implementation for creating customer
    console.log('Creating customer:', newCustomerForm);
    setIsNewCustomerOpen(false);
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
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
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
                  <Label htmlFor="province" className="text-gray-300">Province</Label>
                  <Select value={newCustomerForm.province} onValueChange={(value) => setNewCustomerForm(prev => ({ ...prev, province: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Province" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="Western Cape">Western Cape</SelectItem>
                      <SelectItem value="Gauteng">Gauteng</SelectItem>
                      <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                      <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                      <SelectItem value="Free State">Free State</SelectItem>
                      <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                      <SelectItem value="Limpopo">Limpopo</SelectItem>
                      <SelectItem value="North West">North West</SelectItem>
                      <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                  <Input 
                    id="postalCode"
                    value={newCustomerForm.postalCode}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal code"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewCustomerOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                  Add Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers List */}
      <div className="grid gap-4">
        {customers.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No customers found</h3>
              <p className="text-gray-300 text-center mb-4">
                Add your first customer to start building your collection route
              </p>
              <Button onClick={() => setIsNewCustomerOpen(true)} className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
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
