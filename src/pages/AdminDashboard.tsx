import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  Recycle, 
  DollarSign, 
  TrendingUp,
  Calendar,
  MapPin,
  Package,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  // Mock data for demonstration
  const mockStats = {
    totalUsers: 1250,
    totalPickups: 3420,
    totalKgRecycled: 15680,
    totalValue: 78450,
    pendingPickups: 45,
    activeCollectors: 28,
    monthlyGrowth: 12.5,
    systemHealth: 'excellent'
  };

  const mockRecentPickups = [
    { id: 1, customer: "John Doe", address: "123 Main St, Cape Town", status: "completed", kg: 15.5, value: 77.50, date: "2024-01-15" },
    { id: 2, customer: "Jane Smith", address: "456 Oak Ave, Johannesburg", status: "in_progress", kg: 8.2, value: 41.00, date: "2024-01-15" },
    { id: 3, customer: "Bob Wilson", address: "789 Pine Rd, Durban", status: "pending", kg: 12.0, value: 60.00, date: "2024-01-14" },
    { id: 4, customer: "Alice Brown", address: "321 Elm St, Pretoria", status: "completed", kg: 22.1, value: 110.50, date: "2024-01-14" },
    { id: 5, customer: "Charlie Davis", address: "654 Maple Dr, Port Elizabeth", status: "in_progress", kg: 18.7, value: 93.50, date: "2024-01-13" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  const formatWeight = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)} tons`;
    return `${num.toFixed(1)} kg`;
  };

  return (
    <AdminLayout currentPage="/admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to Woza Mali Admin Portal</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              System Status: {mockStats.systemHealth}
            </Badge>
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatNumber(mockStats.totalUsers)}
              </div>
              <p className="text-xs text-gray-500">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pickups
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <Recycle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatNumber(mockStats.totalPickups)}
              </div>
              <p className="text-xs text-gray-500">
                {mockStats.pendingPickups} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                KG Recycled
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Package className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatWeight(mockStats.totalKgRecycled)}
              </div>
              <p className="text-xs text-gray-500">
                Waste diverted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(mockStats.totalValue)}
              </div>
              <p className="text-xs text-gray-500">
                +{mockStats.monthlyGrowth}% this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pickups */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Recycle className="h-5 w-5 text-green-600" />
                <span>Recent Pickups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentPickups.map((pickup) => (
                  <div key={pickup.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {new Date(pickup.date).toLocaleDateString()}
                        </span>
                      </div>
                      {getStatusBadge(pickup.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium">{pickup.customer}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">KG</p>
                        <p className="font-medium">{pickup.kg}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Value</p>
                        <p className="font-medium">{formatCurrency(pickup.value)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-medium capitalize">{pickup.status.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{pickup.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Recycle className="h-4 w-4 mr-2" />
                View Pickups
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">System Health</h3>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">Active Collectors</h3>
                <p className="text-sm text-gray-500">{mockStats.activeCollectors} online</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-1">Growth Rate</h3>
                <p className="text-sm text-gray-500">+{mockStats.monthlyGrowth}% monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
