"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Target, 
  Leaf, 
  DollarSign, 
  Play,
  Users,
  BarChart3,
  Loader2,
  TrendingUp
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function CollectorDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalKg: 0,
    totalPoints: 0,
    totalEarnings: 0
  });

  // Load basic stats on component mount
  useEffect(() => {
    if (user) {
      loadBasicStats();
    }
  }, [user]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  // Redirect non-collectors to unauthorized page
  useEffect(() => {
    if (user && user.role && user.role !== 'COLLECTOR') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadBasicStats = async () => {
    try {
      setIsLoading(true);
      // Load basic stats here
      const mockStats = {
        totalCollections: 156,
        totalKg: 2347.5,
        totalPoints: 3456,
        totalEarnings: 2345.67
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
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
                <img 
                  src="/W yellow.png" 
                  alt="Woza Mali Logo" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Woza Mali</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collector Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email || 'Collector'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">COLLECTOR</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-24">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, Collector!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your recycling collections and track your performance
          </p>
        </div>

        {/* Quick Actions - Always Visible */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-medium">Live Collections</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">Active</div>
                <p className="text-sm opacity-90">View ongoing pickups</p>
                <Button asChild className="mt-3 w-full bg-white text-amber-600 hover:bg-gray-100">
                  <Link href="/pickups">
                    <Play className="h-4 w-4 mr-2" />
                    Manage
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-medium">New Pickup</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">Start</div>
                <p className="text-sm opacity-90">Create collection</p>
                <Button asChild className="mt-3 w-full bg-white text-emerald-600 hover:bg-gray-100">
                  <Link href="/pickups">
                    <Package className="h-4 w-4 mr-2" />
                    Begin
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-medium">Add Customer</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">Register</div>
                <p className="text-sm opacity-90">New customer</p>
                <Button asChild className="mt-3 w-full bg-white text-purple-600 hover:bg-gray-100">
                  <Link href="/customers">
                    <Users className="h-4 w-4 mr-2" />
                    Add
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-medium">View Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">Analytics</div>
                <p className="text-sm opacity-90">Performance data</p>
                <Button asChild className="mt-3 w-full bg-white text-rose-600 hover:bg-gray-100">
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
              <div className="text-4xl font-bold">{stats.totalCollections}</div>
              <p className="text-xs opacity-90 mt-1">Lifetime total</p>
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
              <div className="text-4xl font-bold">{stats.totalKg.toFixed(1)} kg</div>
              <p className="text-xs opacity-90 mt-1">Lifetime total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              <p className="text-xs opacity-90 mt-1">Lifetime total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-xl shadow-yellow-500/25 hover:shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 hover:-translate-y-1 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">R{stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs opacity-90 mt-1">Lifetime total</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="grid gap-4">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <CardTitle className="text-base">Collection Completed</CardTitle>
                      <CardDescription>John Doe - 25.5 kg collected</CardDescription>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <CardTitle className="text-base">New Customer Added</CardTitle>
                      <CardDescription>Jane Smith registered</CardDescription>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">1 day ago</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <CardTitle className="text-base">Pickup Scheduled</CardTitle>
                      <CardDescription>Bob Johnson - Tomorrow 10:00 AM</CardDescription>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar - Mobile Optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </div>

          {/* Pickups Tab */}
          <Link
            href="/pickups"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </Link>

          {/* Customers Tab */}
          <Link
            href="/customers"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Customers</span>
          </Link>

          {/* Analytics Tab */}
          <Link
            href="/analytics"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}