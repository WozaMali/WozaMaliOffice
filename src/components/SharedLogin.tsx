"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Building2,
  Users,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { defaultCredentials, getRoleDisplayName, getRoleColor, UserRole } from "@/lib/auth-schema";
import { supabase } from "@/lib/supabase";

interface SharedLoginProps {
  appContext: 'admin' | 'collector';
  title: string;
  description: string;
}

export default function SharedLogin({ appContext, title, description }: SharedLoginProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultCredentials[appContext].email);
  const [password, setPassword] = useState(defaultCredentials[appContext].password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { login, isLoading: authLoading, user, profile } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          if (profile) {
            const redirectUrl = getRoleRedirectUrl(profile.role, appContext);
            router.push(redirectUrl);
          } else {
            const defaultUrl = appContext === 'admin' ? '/admin' : '/';
            router.push(defaultUrl);
          }
        }, 1500);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await login(defaultCredentials[appContext].email, defaultCredentials[appContext].password);
      
      if (result.success) {
        setSuccess('Demo login successful! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          if (profile) {
            const redirectUrl = getRoleRedirectUrl(profile.role, appContext);
            router.push(redirectUrl);
          } else {
            const defaultUrl = appContext === 'admin' ? '/admin' : '/';
            router.push(defaultUrl);
          }
        }, 1500);
      } else {
        setError(result.error || 'Demo login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during demo login.');
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get redirect URL based on user role and app context
  const getRoleRedirectUrl = (role: string, appContext: 'admin' | 'collector' = 'admin'): string => {
    switch (role) {
      case 'COLLECTOR':
        return appContext === 'collector' ? '/' : '/collector';
      case 'ADMIN':
      case 'STAFF':
        return appContext === 'admin' ? '/admin' : '/admin';
      case 'CUSTOMER':
        return appContext === 'admin' ? '/dashboard' : '/';
      default:
        return appContext === 'admin' ? '/admin' : '/';
    }
  };

  const getRoleColorClass = (role: UserRole) => {
    return getRoleColor(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6 text-gray-600 hover:text-gray-800"
        >
          ← Back to Home
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
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {description}
            </CardDescription>
            
            {/* Role Badge */}
            <div className="mt-3">
              <Badge 
                variant="outline" 
                className={`${getRoleColorClass(appContext.toUpperCase() as UserRole)} border-2`}
              >
                {appContext === 'admin' ? (
                  <Building2 className="w-4 h-4 mr-2" />
                ) : (
                  <Users className="w-4 h-4 mr-2" />
                )}
                {getRoleDisplayName(appContext.toUpperCase() as UserRole)}
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
                    Email: <span className="font-mono">{defaultCredentials[appContext].email}</span><br/>
                    Password: <span className="font-mono">{defaultCredentials[appContext].password}</span>
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? (
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
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 font-medium py-2.5"
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
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
