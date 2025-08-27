"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function DebugAuthPage() {
  const { user, profile, isLoading, error, login, logout } = useAuth();

  const handleTestLogin = async () => {
    console.log('Testing login with demo credentials...');
    const result = await login('col001@wozamali.com', 'collector123');
    console.log('Login result:', result);
  };

  const handleForceLoadingFalse = () => {
    // This is a temporary debug function
    console.log('Force setting loading to false');
    // Note: This won't work directly, but helps identify the issue
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Debug</h1>
          <p className="text-gray-600">Debug page to troubleshoot authentication issues</p>
        </div>

        {/* Current State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
            <CardDescription>Real-time status of authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Loading State:</label>
                <div className="mt-1">
                  {isLoading ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading...
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">User Status:</label>
                <div className="mt-1">
                  {user ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Logged In
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Not Logged In
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 font-medium">Error:</span>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">User Details:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}

            {profile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-2">Profile Details:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Name:</strong> {profile.full_name}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                  <p><strong>Active:</strong> {profile.is_active ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>Test authentication functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={handleTestLogin} variant="outline">
                Test Login
              </Button>
              
              <Button onClick={handleForceLoadingFalse} variant="outline">
                Force Loading False
              </Button>
              
              {user && (
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Check browser console for detailed logs</p>
              <p>• Monitor network requests in DevTools</p>
              <p>• Verify Supabase environment variables</p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
            <CardDescription>Verify configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
