"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Loader2,
  AlertCircle,
  Recycle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

export default function CollectorLoginPage() {
  const router = useRouter();
  const { login, isLoading, user, profile } = useAuth();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Debug logging - More comprehensive
  useEffect(() => {
    console.log('🔍 Debug - User object:', user);
    console.log('🔍 Debug - Profile object:', profile);
    if (user) {
      console.log('🔍 Debug - User ID:', user.id);
      console.log('🔍 Debug - User email:', user.email);
      console.log('🔍 Debug - User role (if exists):', (user as any).role);
    }
    if (profile) {
      console.log('🔍 Debug - Profile ID:', profile.id);
      console.log('🔍 Debug - Profile role:', profile.role);
      console.log('🔍 Debug - Profile email:', profile.email);
    }
  }, [user, profile]);

  // No auto-redirect - let users manually choose what to do
  // useEffect(() => {
  //   if (user && profile) {
  //     const userRole = profile.role || (user as any).role;
  //     console.log('🔍 Debug - Checking role access. User role:', userRole);
  //     
  //     if (userRole === 'collector' || userRole === 'admin' || 
  //         userRole === 'COLLECTOR' || userRole === 'ADMIN') {
  //       console.log('✅ User authenticated as collector or admin, redirecting to dashboard');
  //       router.push('/');
  //     } else {
  //       console.log('❌ User role not allowed:', userRole);
  //       console.log('❌ Allowed roles: collector, admin, COLLECTOR, ADMIN');
  //       console.log('❌ User has role:', userRole);
  //       router.push('/unauthorized');
  //     }
  //   }
  // }, [user, profile, router]);

  // Always show the form - no conditional rendering
  // if (user && profile) {
  //   const userRole = profile.role || (user as any).role;
  //   console.log('🔍 Debug - Final role check. User role:', userRole);
  //   
  //   if (userRole === 'collector' || userRole === 'admin' || 
  //       userRole === 'COLLECTOR' || userRole === 'ADMIN') {
  //     console.log('✅ Role check passed, redirecting to dashboard');
  //     return null; // Will redirect to dashboard
  //   } else {
  //     console.log('❌ Role check failed, redirecting to unauthorized');
  //     console.log('❌ User has role:', userRole);
  //     return null; // Will redirect to unauthorized
  //   }
  // }

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await login(formData.email, formData.password);

      if (response.success) {
        setSuccess('Login successful! Redirecting to collector dashboard...');
        
        // Redirect after a short delay
        setTimeout(() => {
          const userRole = profile?.role || (user as any)?.role;
          console.log('🔍 Debug - Login success, checking role:', userRole);
          
          if (userRole === 'collector' || userRole === 'admin' || 
              userRole === 'COLLECTOR' || userRole === 'ADMIN') {
            console.log('✅ Login successful, redirecting to dashboard');
            router.push('/');
          } else if (!userRole) {
            // For development, allow users without roles to access the dashboard
            console.log('⚠️ Development mode: User has no role, allowing access to dashboard');
            router.push('/');
          } else {
            console.log('❌ Login successful but role not allowed:', userRole);
            setError(`Access denied. Your role '${userRole}' is not authorized for this portal. Contact your supervisor for collector access.`);
          }
        }, 1500);
      } else {
        setError(response.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Recycle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Woza Mali</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Collector Portal</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to access your recycling dashboard</p>
        </div>

        {/* Debug Information - Temporary */}
        {user && (
          <Card className="shadow-xl border-0 bg-yellow-50 dark:bg-yellow-900/20 backdrop-blur-sm mb-4">
            <CardHeader className="text-center space-y-1 pb-2">
              <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">
                🔍 Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>User ID: {user.id}</div>
              <div>User Email: {user.email}</div>
              <div>Profile Role: {profile?.role || 'No profile'}</div>
              <div>User Role: {(user as any).role || 'No role'}</div>
              <div>Expected Roles: collector, admin, COLLECTOR, ADMIN</div>
              
              {/* Manual Action Buttons */}
              <div className="mt-3 space-y-2">
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => router.push('/')}
                >
                  🚀 Go to Dashboard
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-gray-300 text-gray-700"
                  onClick={() => window.location.reload()}
                >
                  🔄 Refresh Page
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      window.location.reload();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                >
                  🚪 Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-1 pb-6">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-green-600" />
              Collector Login
            </CardTitle>
            <CardDescription>
              Access your recycling collection dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your collector email"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    handleInputChange('rememberMe', checked === true)
                  }
                  disabled={isLoading}
                  className="text-green-600 focus:ring-green-500"
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-300">
                  Remember me on this device
                </Label>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Access Collector Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials for Collectors */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800 dark:text-green-200">Demo Collector Accounts</CardTitle>
                <CardDescription className="text-xs text-green-600 dark:text-green-300">
                  Use these accounts to test the collector portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {/* Original Demo Account */}
                <div className="p-2 rounded bg-white dark:bg-green-800/30 border border-green-200 dark:border-green-700">
                  <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Demo Account 1:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800 dark:text-green-200">Email:</span>
                    <code className="text-green-600 dark:text-green-300">col001@wozamali.com</code>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium text-green-800 dark:text-green-200">Password:</span>
                    <code className="text-green-600 dark:text-green-300">collector123</code>
                  </div>
                </div>
                
                {/* Dumisani's Account */}
                <div className="p-2 rounded bg-white dark:bg-green-800/30 border border-green-200 dark:border-green-700">
                  <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Demo Account 2:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800 dark:text-green-200">Email:</span>
                    <code className="text-green-600 dark:text-green-300">dumisani@wozamali.co.za</code>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium text-green-800 dark:text-green-200">Password:</span>
                    <code className="text-green-600 dark:text-green-300">Dumisani123</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Having trouble signing in?
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto">
                  Reset Password
                </Button>
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Woza Mali. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Secure recycling collection management system
          </p>
        </div>
      </div>
    </div>
  );
}
