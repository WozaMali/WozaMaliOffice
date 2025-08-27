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
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@wozamali.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forceShowForm, setForceShowForm] = useState(false);
  
  const { login, isLoading: authLoading, user, profile } = useAuth();

  // Force show form after 3 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('AdminLogin: Force showing login form after timeout');
      setForceShowForm(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // If user is already logged in, redirect to admin dashboard
  useEffect(() => {
    if (user && profile) {
      console.log('AdminLogin: User already logged in, redirecting to admin dashboard');
      router.push('/admin');
    }
  }, [user, profile, router]);

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
        setSuccess('Login successful! Redirecting to admin dashboard...');
        console.log('AdminLogin: Login successful, setting redirect timer...');
        
        // Redirect after a short delay
        setTimeout(() => {
          console.log('AdminLogin: Redirecting to admin dashboard...');
          router.push('/admin');
        }, 1500);
      } else {
        console.error('AdminLogin: Login failed:', result.error);
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('AdminLogin: Unexpected login error:', err);
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
        setSuccess('Demo login successful! Redirecting to admin dashboard...');
        console.log('AdminLogin: Demo login successful, setting redirect timer...');
        
        // Redirect after a short delay
        setTimeout(() => {
          console.log('AdminLogin: Redirecting to admin dashboard...');
          router.push('/admin');
        }, 1500);
      } else {
        console.error('AdminLogin: Demo login failed:', result.error);
        setError(result.error || 'Demo login failed. Please try again.');
      }
    } catch (err) {
      console.error('AdminLogin: Unexpected demo login error:', err);
      setError('An unexpected error occurred during demo login.');
    } finally {
      console.log('AdminLogin: Demo login - setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Show loading only briefly while auth initializes, with fallback
  if (authLoading && !forceShowForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing...</h2>
          <p className="text-gray-600 mb-4">Setting up authentication system</p>
          
          {/* Force show button */}
          <Button 
            onClick={() => setForceShowForm(true)}
            variant="outline"
            className="mt-4"
          >
            Show Login Form Now
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            If this takes too long, click to proceed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

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
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Access
            </CardTitle>
            <p className="text-gray-600">
              Administrator Portal - Authorized Personnel Only
            </p>
            
            {/* Role Badge */}
            <div className="mt-3">
              <Badge 
                variant="outline" 
                className="bg-blue-100 text-blue-800 border-blue-300"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Administrator
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Demo Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Demo Credentials Available</p>
                  <p className="text-blue-700">
                    Email: <span className="font-mono">admin@wozamali.com</span><br/>
                    Password: <span className="font-mono">admin123</span>
                  </p>
                </div>
              </div>
            </div>

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
                    'Sign In'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoLogin}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-medium py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    'Quick Demo Login'
                  )}
                </Button>
              </div>
            </form>

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
