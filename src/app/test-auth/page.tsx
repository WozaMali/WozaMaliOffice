"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Shield } from "lucide-react";

export default function TestAuthPage() {
  const { user, profile, isLoading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    const result = await login('admin@wozamali.com', 'admin123');
    console.log('Login result:', result);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>User ID:</strong> {user?.id || 'Not logged in'}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || 'Not logged in'}
            </div>
            <div>
              <strong>Profile Role:</strong> {profile?.role || 'No profile'}
            </div>
            <div>
              <strong>Profile Name:</strong> {profile?.full_name || 'No name'}
            </div>
            <div>
              <strong>Is Active:</strong> {profile?.is_active ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Test Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <Button onClick={handleTestLogin} className="w-full">
                Test Login (admin@wozamali.com)
              </Button>
            ) : (
              <Button onClick={logout} variant="destructive" className="w-full">
                Logout
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>This page helps test the authentication system.</p>
          <p>Check the browser console for login results.</p>
        </div>
      </div>
    </div>
  );
}
