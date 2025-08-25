import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Recycle, 
  DollarSign,
  Calendar,
  MapPin
} from "lucide-react";

export default function AdminAnalytics() {
  // Mock analytics data
  const mockData = {
    totalRevenue: 125000,
    monthlyGrowth: 15.2,
    topRegions: [
      { name: "Cape Town", revenue: 45000, collections: 1250 },
      { name: "Johannesburg", revenue: 38000, collections: 980 },
      { name: "Durban", revenue: 22000, collections: 650 },
      { name: "Pretoria", revenue: 20000, collections: 520 }
    ],
    recentTrends: [
      { month: "Jan", revenue: 85000, collections: 2100 },
      { month: "Feb", revenue: 92000, collections: 2300 },
      { month: "Mar", revenue: 88000, collections: 2200 },
      { month: "Apr", revenue: 95000, collections: 2400 },
      { month: "May", revenue: 102000, collections: 2600 },
      { month: "Jun", revenue: 125000, collections: 3100 }
    ]
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  return (
    <AdminLayout currentPage="/admin/analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your recycling operations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(mockData.totalRevenue)}
              </div>
              <p className="text-xs text-green-600">
                +{mockData.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Collections
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <Recycle className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {mockData.recentTrends[mockData.recentTrends.length - 1].collections.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                1,250
              </div>
              <p className="text-xs text-purple-600">
                +8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Revenue Trends (Last 6 Months)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.recentTrends.map((trend, index) => (
                <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-center">
                      <p className="font-semibold text-gray-900">{trend.month}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Revenue</span>
                        <span className="font-medium">{formatCurrency(trend.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(trend.revenue / Math.max(...mockData.recentTrends.map(t => t.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Collections</p>
                    <p className="font-medium">{trend.collections.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Top Performing Regions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.topRegions.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{region.name}</h3>
                      <p className="text-sm text-gray-500">{region.collections} collections</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(region.revenue)}</p>
                    <p className="text-sm text-gray-500">
                      {((region.revenue / mockData.totalRevenue) * 100).toFixed(1)}% of total
                    </p>
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                User Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
