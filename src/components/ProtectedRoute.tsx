"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { canAccessAdmin, canAccessCollector, getRoleDisplayName } from '@/lib/auth-schema';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'STAFF' | 'COLLECTOR';
  allowedRoles?: ('ADMIN' | 'STAFF' | 'COLLECTOR')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/');
      return;
    }

    // Check role-based access
    if (user && requiredRole && user.role !== requiredRole) {
      const redirectPath = redirectTo || getDefaultRedirectPath(user.role);
      router.push(redirectPath);
      return;
    }

    // Check if user has any of the allowed roles
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      const redirectPath = redirectTo || getDefaultRedirectPath(user.role);
      router.push(redirectPath);
      return;
    }

    // Check specific access permissions based on current path
    if (user && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      if (currentPath.startsWith('/admin') && !canAccessAdmin(user)) {
        router.push('/collector');
        return;
      }

      if (currentPath.startsWith('/collector') && !canAccessCollector(user)) {
        router.push('/admin');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, requiredRole, allowedRoles, redirectTo, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render children if role check fails
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

function getDefaultRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'STAFF':
      return '/admin';
    case 'COLLECTOR':
      return '/collector';
    default:
      return '/dashboard';
  }
}

// Specific route protectors
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} redirectTo="/collector">
      {children}
    </ProtectedRoute>
  );
}

export function CollectorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="COLLECTOR" redirectTo="/admin">
      {children}
    </ProtectedRoute>
  );
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin">
      {children}
    </ProtectedRoute>
  );
}
