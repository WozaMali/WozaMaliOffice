"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  Building2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { config } from "@/lib/config";

// Helper function to check if user has admin privileges
const isAdminUser = (user: any, profile: any) => {
  if (!user) return false;
  
  // Check profile role first (from database)
  if (profile?.role) {
    const role = profile.role.toLowerCase();
    return ['admin', 'super_admin', 'superadmin'].includes(role);
  }
  
  // Special case: superadmin@wozamali.co.za should always be treated as super admin
  const email = user.email?.toLowerCase() || '';
  if (email === 'superadmin@wozamali.co.za') {
    return true;
  }
  
  // Fallback to other admin emails
  return email === 'admin@wozamali.com' || 
         email.includes('admin@wozamali');
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'superadmin'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { login, resetPassword, isLoading: authLoading, user, profile } = useAuth();

  // Clear form when switching tabs
  const handleTabChange = (tab: 'admin' | 'superadmin') => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  // If user is already logged in and has admin or super_admin role, redirect to admin dashboard
  useEffect(() => {
    if (user?.email) {
      const userEmail = user.email.toLowerCase();
      const isAdminUserResult = isAdminUser(user, profile);
      
      if (isAdminUserResult) {
        console.log('AdminLogin: Admin user already logged in, redirecting to Office App admin dashboard');
        const officeUrl = config.getOfficeUrl();
        console.log('AdminLogin: Using office URL:', officeUrl);
        window.location.href = `${officeUrl}/admin`;
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AdminLogin: Login attempt started');
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('AdminLogin: Calling login function...');
      const result = await login(email, password);
      console.log('AdminLogin: Login result:', result);
      
      if (result.success) {
        // Check if user has admin role - check email directly since profile might not be loaded yet
        const userEmail = email.toLowerCase();
        const nextIsAdmin = isAdminUser({ email }, profile);
        
        if (nextIsAdmin) {
          const isSuperAdmin = userEmail === 'superadmin@wozamali.co.za';
          const roleText = isSuperAdmin ? 'Super Admin' : 'Admin';
          setSuccess(`${roleText} login successful! Redirecting to Office App admin dashboard...`);
          console.log('AdminLogin: Admin login successful, setting redirect timer...');
          
          // Redirect after a short delay
          setTimeout(() => {
            console.log('AdminLogin: Redirecting to Office App admin dashboard...');
            const officeUrl = config.getOfficeUrl();
            console.log('AdminLogin: Using office URL:', officeUrl);
            window.location.href = `${officeUrl}/admin`;
          }, 1500);
        } else {
          setError('Access denied. This account does not have administrator privileges.');
          console.error('AdminLogin: User does not have admin role');
        }
      } else {
        console.error('AdminLogin: Login failed:', result.error);
        setError(result.error || 'Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('AdminLogin: Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('AdminLogin: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    console.log('AdminLogin: Super Admin login attempt started');
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('AdminLogin: Calling super admin login...');
      const result = await login('superadmin@wozamali.co.za', password);
      console.log('AdminLogin: Super admin login result:', result);
      
      if (result.success) {
        setSuccess('Super Admin login successful! Redirecting to Office App admin dashboard...');
        console.log('AdminLogin: Super admin login successful, setting redirect timer...');
        
        // Redirect after a short delay
        setTimeout(() => {
          console.log('AdminLogin: Redirecting to Office App admin dashboard...');
          const officeUrl = process.env.NEXT_PUBLIC_OFFICE_URL || 'http://localhost:8081';
          window.location.href = `${officeUrl}/admin`;
        }, 1500);
      } else {
        console.error('AdminLogin: Super admin login failed:', result.error);
        setError(result.error || 'Super Admin login failed. Please check your password and try again.');
      }
    } catch (err) {
      console.error('AdminLogin: Unexpected super admin login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('AdminLogin: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    console.log('AdminLogin: Demo login attempt started');
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('AdminLogin: Calling demo login...');
      const result = await login('admin@wozamali.com', 'admin123');
      console.log('AdminLogin: Demo login result:', result);
      
      if (result.success) {
        // Check if user has admin role - demo login uses admin@wozamali.com
        const isAdmin = true; // Demo login is always admin
        
        if (isAdmin) {
          setSuccess('Demo login successful! Redirecting to Office App admin dashboard...');
          console.log('AdminLogin: Demo admin login successful, setting redirect timer...');
          
          // Redirect after a short delay
          setTimeout(() => {
            console.log('AdminLogin: Redirecting to Office App admin dashboard...');
            const officeUrl = config.getOfficeUrl();
            console.log('AdminLogin: Using office URL:', officeUrl);
            window.location.href = `${officeUrl}/admin`;
          }, 1500);
        } else {
          setError('Access denied. Demo account does not have administrator privileges.');
          console.error('AdminLogin: Demo user does not have admin role');
        }
      } else {
        console.error('AdminLogin: Demo login failed:', result.error);
        setError(result.error || 'Demo login failed. Please check the demo credentials.');
      }
    } catch (err) {
      console.error('AdminLogin: Unexpected demo login error:', err);
      setError('An unexpected error occurred during demo login.');
    } finally {
      console.log('AdminLogin: Demo login - setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AdminLogin: Password reset attempt for:', resetEmail);
    setIsResetting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await resetPassword(resetEmail);
      console.log('AdminLogin: Password reset result:', result);
      
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox and click the link to reset your password.');
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        setError(result.error || 'Failed to send password reset email. Please try again.');
      }
    } catch (err) {
      console.error('AdminLogin: Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Show loading only briefly while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Initializing...</h2>
          <p className="text-gray-300">Setting up authentication system</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button removed */}

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/w yellow.png" 
                alt="Woza Mali Logo" 
                className="w-16 h-16"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Woza Mali Access
            </CardTitle>
            <p className="text-gray-600">
              Administrator Portal - Authorized Personnel Only
            </p>
            
            {/* Login Type Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mt-4">
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('superadmin')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'superadmin'
                    ? 'bg-white text-yellow-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Super Admin
              </button>
            </div>
            
            {/* Role Badge */}
            <div className="mt-3">
              <Badge 
                variant="outline" 
                className={`${
                  activeTab === 'superadmin'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {activeTab === 'superadmin' ? (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Super Administrator
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Administrator
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Demo info removed */}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            {activeTab === 'admin' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In as Admin'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Super Admin Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Crown className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="font-semibold text-yellow-800">Super Admin Access</h3>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Email: <span className="font-mono">superadmin@wozamali.co.za</span>
                  </p>
                  <p className="text-xs text-yellow-600">
                    Full system access with all administrative privileges
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="superadmin-password" className="text-gray-700 font-medium">
                    Super Admin Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="superadmin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter super admin password"
                      required
                      className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleSuperAdminLogin}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Sign In as Super Admin
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Password Reset Form */}
            {showForgotPassword && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reset Password</h3>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-gray-700 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Email'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Additional Info */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>Need help? Contact your system administrator</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
