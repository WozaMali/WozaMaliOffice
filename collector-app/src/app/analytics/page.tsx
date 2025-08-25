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
  Users
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your collection performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.collections}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Collected</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.kg.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.points}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {currentStats.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Your collection performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Average Collections</span>
                <span className="text-sm text-muted-foreground">
                  {timeRange === 'week' ? (stats.weeklyCollections / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyCollections / 30).toFixed(1) : 
                   (stats.totalCollections / 365).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Average Weight</span>
                <span className="text-sm text-muted-foreground">
                  {timeRange === 'week' ? (stats.weeklyKg / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyKg / 30).toFixed(1) : 
                   (stats.totalKg / 365).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Efficiency Rate</span>
                <span className="text-sm text-muted-foreground">
                  {((currentStats.collections / Math.max(currentStats.collections, 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Environmental Impact
            </CardTitle>
            <CardDescription>
              Your contribution to sustainability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CO₂ Saved</span>
                <span className="text-sm text-muted-foreground">
                  {(currentStats.kg * 2.5).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Water Saved</span>
                <span className="text-sm text-muted-foreground">
                  {(currentStats.kg * 3.5).toFixed(1)} liters
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trees Equivalent</span>
                <span className="text-sm text-muted-foreground">
                  {(currentStats.kg / 22).toFixed(1)} trees
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest collection activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Collection completed</span>
              </div>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">New customer added</span>
              </div>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Pickup scheduled</span>
              </div>
              <span className="text-sm text-muted-foreground">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation Bar - Mobile Optimized */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          {/* Overview Tab */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Overview</span>
          </Link>

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
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
