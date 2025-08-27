"use client";

import { useState } from "react";
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
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

export default function AdminLoginPage() {
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

  // Redirect already authenticated admins to admin dashboard
  if (user && profile && profile.role === 'admin') {
    router.push('/admin');
    return null;
  }

  // Redirect non-admins away from admin portal
  if (user && profile && profile.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

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
        setSuccess('Login successful! Redirecting to admin dashboard...');
        
        // Redirect after a short delay
        setTimeout(() => {
          if (profile && profile.role === 'admin') {
            router.push('/admin');
          } else {
            setError('Access denied. This portal is for administrators only.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Woza Mali</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Admin Portal</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to access your admin dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-1 pb-6">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-blue-600" />
              Admin & Staff Login
            </CardTitle>
            <CardDescription>
              Access your administrative dashboard
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
                    placeholder="Enter your admin email"
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                  className="text-blue-600 focus:ring-blue-500"
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
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" 
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
                    Access Admin Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials for Admins */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Demo Admin Account</CardTitle>
                <CardDescription className="text-xs text-blue-600 dark:text-blue-300">
                  Use this account to test the admin portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2 rounded bg-white dark:bg-blue-800/30 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Admin:</span>
                    <code className="text-blue-600 dark:text-blue-300">admin@wozamali.com</code>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Password:</span>
                    <code className="text-blue-600 dark:text-blue-300">admin123</code>
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
                <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                  Reset Password
                </Button>
                <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
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
            Administrative portal for recycling management
          </p>
        </div>
      </div>
    </div>
  );
}
