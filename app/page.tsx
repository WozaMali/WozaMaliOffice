"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'collector' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse error from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('Access denied. You do not have permission to access this system.');
    }
  }, []);

  const clearError = () => {
    setError(null);
    // Remove error from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (selectedRole) {
    // Redirect to appropriate login page based on role selection
    if (selectedRole === 'admin') {
      window.location.href = '/admin-login';
    } else if (selectedRole === 'collector') {
      window.location.href = '/collector-login';
    }
    return null; // Return null while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Logo and Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <img 
            src="/w yellow.png" 
            alt="Woza Mali Logo" 
            className="w-24 h-24 md:w-32 md:h-32"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Woza Mali
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Professional Recycling Collection & Management System
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-medium mb-3">{error}</p>
            <Button onClick={clearError} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Clear Message
            </Button>
          </div>
        </div>
      )}

      {/* Role Selection */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Select Your Role
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Choose your role to access the appropriate system portal
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              onClick={() => setSelectedRole('admin')}
              className="h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 hover:border-blue-700"
            >
              <Building2 className="w-6 h-6 mr-3" />
              Administrator
            </Button>
            
            <Button
              onClick={() => setSelectedRole('collector')}
              className="h-16 text-lg bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-600 hover:border-orange-700"
            >
              <Users className="w-6 h-6 mr-3" />
              Collector
            </Button>
          </div>
        </div>
      </div>

      {/* Direct Access Buttons */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-medium mb-3">Direct Access to Dashboards</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/admin'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
            <Button
              onClick={() => window.location.href = '/collector'}
              variant="outline"
              className="border-orange-600 text-orange-700 hover:bg-orange-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Collector Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Direct Login Access */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium mb-3">Direct Access to Login Pages</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/admin-login'}
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Admin Login
            </Button>
            <Button
              onClick={() => window.location.href = '/collector-login'}
              variant="outline"
              className="border-orange-600 text-orange-700 hover:bg-orange-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Collector Login
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Link */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-medium mb-3">Having Login Issues?</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/debug-auth'}
              variant="outline"
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            >
              Debug Authentication
            </Button>
            <Button
              onClick={() => window.location.href = '/test-connection'}
              variant="outline"
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            >
              Test Connection
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>&copy; 2024 Woza Mali. All rights reserved.</p>
        <p className="mt-1">Professional Recycling Management Solutions</p>
      </div>
    </div>
  );
}
