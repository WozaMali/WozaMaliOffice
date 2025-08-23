import React from "react";
import { CustomerDashboard } from "../components/CustomerDashboard";
import { useAuth } from "../hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function CustomerDashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    if (!isLoading && user && profile && profile.role !== 'CUSTOMER') {
      // Redirect non-customers to appropriate dashboard
      if (profile.role === 'ADMIN' || profile.role === 'STAFF') {
        router.push('/admin');
      } else if (profile.role === 'COLLECTOR') {
        router.push('/collector');
      }
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to login
  }

  if (profile.role !== 'CUSTOMER') {
    return null; // Will redirect to appropriate dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CustomerDashboard />
      </div>
    </div>
  );
}
