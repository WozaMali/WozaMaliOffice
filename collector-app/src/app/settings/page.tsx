"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2,
  Save,
  Settings,
  BarChart3,
  Users,
  Package,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

interface CollectorProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

export default function CollectorSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<CollectorProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
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

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      // TODO: Load profile from API
      // For now, populate with user data if available
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          province: user.province || '',
          postalCode: user.postalCode || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      // TODO: Save profile to API
      console.log('Saving profile:', profile);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (you can use toast here)
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CollectorProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
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
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-300">Manage your profile and preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-orange-400" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-300">
              Update your basic contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input 
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
              <Input 
                id="phone"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-yellow-400" />
              Address Information
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your residential address for records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-gray-300">Street Address</Label>
              <Input 
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your street address"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="text-gray-300">City</Label>
                <Input 
                  id="city"
                  value={profile.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="province" className="text-gray-300">Province</Label>
                <Input 
                  id="province"
                  value={profile.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="Province"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                <Input 
                  id="postalCode"
                  value={profile.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="Postal code"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5 text-orange-400" />
              Emergency Contact
            </CardTitle>
            <CardDescription className="text-gray-300">
              Someone to contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact" className="text-gray-300">Contact Name</Label>
                <Input 
                  id="emergencyContact"
                  value={profile.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Emergency contact name"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyPhone" className="text-gray-300">Contact Phone</Label>
                <Input 
                  id="emergencyPhone"
                  value={profile.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="Emergency contact phone"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-yellow-400" />
              Additional Information
            </CardTitle>
            <CardDescription className="text-gray-300">
              Any additional notes or preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes" className="text-gray-300">Notes</Label>
              <Textarea 
                id="notes"
                value={profile.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mb-20">
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black px-8 py-3 text-lg font-medium shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
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
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-orange-500 text-white">
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Settings</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
