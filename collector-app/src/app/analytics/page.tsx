"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
  Leaf,
  Target,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Users,
  Settings
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function CollectorAnalyticsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalKg: 0,
    totalPoints: 0,
    totalEarnings: 0,
    monthlyCollections: 0,
    monthlyKg: 0,
    monthlyPoints: 0,
    monthlyEarnings: 0,
    weeklyCollections: 0,
    weeklyKg: 0,
    weeklyPoints: 0,
    weeklyEarnings: 0
  });

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange]);

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

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      // Mock data for now
      const mockStats = {
        totalCollections: 156,
        totalKg: 2347.5,
        totalPoints: 3456,
        totalEarnings: 2345.67,
        monthlyCollections: 23,
        monthlyKg: 345.2,
        monthlyPoints: 456,
        monthlyEarnings: 345.67,
        weeklyCollections: 5,
        weeklyKg: 78.9,
        weeklyPoints: 123,
        weeklyEarnings: 98.76
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStats = () => {
    switch (timeRange) {
      case 'week':
        return {
          collections: Math.floor(stats.weeklyCollections),
          kg: Math.floor(stats.weeklyKg),
          points: Math.floor(stats.weeklyPoints),
          earnings: Math.floor(stats.weeklyEarnings)
        };
      case 'month':
        return {
          collections: stats.monthlyCollections,
          kg: stats.monthlyKg,
          points: stats.monthlyPoints,
          earnings: stats.monthlyEarnings
        };
      case 'year':
        return {
          collections: stats.totalCollections,
          kg: stats.totalKg,
          points: stats.totalPoints,
          earnings: stats.totalEarnings
        };
      default:
        return {
          collections: stats.monthlyCollections,
          kg: stats.monthlyKg,
          points: stats.monthlyPoints,
          earnings: stats.monthlyEarnings
        };
    }
  };

  const currentStats = getCurrentStats();

  // Show loading while checking authentication
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-300">Track your collection performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Collections</CardTitle>
            <Package className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{currentStats.collections}</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Weight Collected</CardTitle>
            <Target className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{currentStats.kg.toFixed(1)} kg</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Points Earned</CardTitle>
            <Leaf className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{currentStats.points}</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">98%</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Performance Trends
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your collection performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Daily Average Collections</span>
                <span className="text-sm text-gray-400">
                  {timeRange === 'week' ? (stats.weeklyCollections / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyCollections / 30).toFixed(1) : 
                   (stats.totalCollections / 365).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Daily Average Weight</span>
                <span className="text-sm text-gray-400">
                  {timeRange === 'week' ? (stats.weeklyKg / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyKg / 30).toFixed(1) : 
                   (stats.totalKg / 365).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Efficiency Rate</span>
                <span className="text-sm text-gray-400">
                  {((currentStats.collections / Math.max(currentStats.collections, 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-yellow-400" />
              Environmental Impact
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your contribution to sustainability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">CO₂ Saved</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg * 2.5).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Water Saved</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg * 3.5).toFixed(1)} liters
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Trees Equivalent</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg / 22).toFixed(1)} trees
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-orange-400" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your latest collection activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Collection completed</span>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">New customer added</span>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Pickup scheduled</span>
              </div>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation Bar - Mobile Optimized - DARK GREY + ORANGE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </Link>

          {/* Pickups Tab */}
          <Link
            href="/pickups"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Pickups</span>
          </Link>

          {/* Customers Tab */}
          <Link
            href="/customers"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Customers</span>
          </Link>

          {/* Analytics Tab */}
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-orange-500 text-white">
            <TrendingUp className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </div>

          {/* Settings Tab */}
          <Link
            href="/settings"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
