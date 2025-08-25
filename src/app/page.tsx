"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  BarChart3,
  Package,
  DollarSign,
  Leaf,
  Target,
  Loader2,
  Calendar,
  TrendingUp,
  Recycle
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function Home() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Redirect unauthenticated users to admin login
  useEffect(() => {
    if (!user) {
      window.location.href = '/admin-login';
    }
  }, [user]);

  // Redirect non-admin users to unauthorized page
  useEffect(() => {
    if (user && user.role && !['ADMIN', 'STAFF'].includes(user.role)) {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // Load user data here
      // This would typically call your user service
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Woza Mali</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Admin Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your recycling operations and monitor system performance
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">1,247</div>
              <p className="text-xs opacity-90 mt-1">System-wide total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Kg Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">18,456 kg</div>
              <p className="text-xs opacity-90 mt-1">System-wide total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">24.3 tons</div>
              <p className="text-xs opacity-90 mt-1">CO2 saved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">R 45,678</div>
              <p className="text-xs opacity-90 mt-1">System-wide total</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Dashboard Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200">
            <Link href="/admin" className="block">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Admin Dashboard</CardTitle>
                <CardDescription>
                  Manage users, pickups, payments, and system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Quick actions:
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Manage users</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>Monitor pickups</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Calculator Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-200">
            <Link href="/calculator" className="block">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/40 transition-colors">
                  <Recycle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Recycling Calculator</CardTitle>
                <CardDescription>
                  Calculate environmental impact and rewards for recycling
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Features:
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Leaf className="h-4 w-4 text-gray-400" />
                    <span>Environmental impact</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span>Rewards calculation</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* System Status Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-200">
            <Link href="/admin" className="block">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40 transition-colors">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">System Status</CardTitle>
                <CardDescription>
                  Monitor system health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Status:
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>All systems operational</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Last updated: Today</span>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Need to get started quickly?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/admin">
                <BarChart3 className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/calculator">
                <Recycle className="h-4 w-4 mr-2" />
                Calculator
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
