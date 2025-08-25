"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Recycle, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Activity,
  Package,
  DollarSign,
  TrendingUp,
  Navigation,
  Phone,
  Mail
} from "lucide-react";

export default function CollectorPage() {
  // Mock data for demonstration
  const mockCollectorStats = {
    totalCollections: 156,
    totalKgCollected: 2840,
    totalEarnings: 14200,
    averageRating: 4.8,
    activePickups: 3,
    completedToday: 2,
    monthlyGoal: 80,
    monthlyProgress: 65
  };

  const mockActivePickups = [
    { 
      id: 1, 
      customer: "Sarah Johnson", 
      address: "123 Oak Street, Cape Town", 
      phone: "+27 82 123 4567",
      email: "sarah.j@email.com",
      status: "in_progress", 
      scheduledTime: "14:00", 
      estimatedKg: 18.5,
      materials: ["Paper", "Plastic", "Glass"],
      notes: "Large collection, bring extra bags"
    },
    { 
      id: 2, 
      customer: "Mike Thompson", 
      address: "456 Pine Avenue, Johannesburg", 
      phone: "+27 83 234 5678",
      email: "mike.t@email.com",
      status: "pending", 
      scheduledTime: "15:30", 
      estimatedKg: 12.0,
      materials: ["Paper", "Cardboard"],
      notes: "Small collection, quick pickup"
    },
    { 
      id: 3, 
      customer: "Lisa Chen", 
      address: "789 Elm Road, Durban", 
      phone: "+27 84 345 6789",
      email: "lisa.c@email.com",
      status: "scheduled", 
      scheduledTime: "16:00", 
      estimatedKg: 25.0,
      materials: ["Paper", "Plastic", "Metal", "Glass"],
      notes: "Very organized, separated by type"
    }
  ];

  const mockRecentCollections = [
    { id: 1, customer: "John Doe", address: "321 Main St, Cape Town", kg: 15.5, earnings: 77.50, rating: 5, date: "2024-01-15" },
    { id: 2, customer: "Jane Smith", address: "654 Oak Ave, Johannesburg", kg: 8.2, earnings: 41.00, rating: 4, date: "2024-01-15" },
    { id: 3, customer: "Bob Wilson", address: "987 Pine Rd, Durban", kg: 22.1, earnings: 110.50, rating: 5, date: "2024-01-14" },
    { id: 4, customer: "Alice Brown", address: "147 Elm St, Pretoria", kg: 12.0, earnings: 60.00, rating: 4, date: "2024-01-14" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'scheduled':
        return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
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

  const getRatingStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Collector Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Dumisani! Ready to make a difference today?</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Status: Active & Available
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collections
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Recycle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatNumber(mockCollectorStats.totalCollections)}
            </div>
            <p className="text-xs text-muted-foreground">
              Collections completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              KG Collected
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Package className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatWeight(mockCollectorStats.totalKgCollected)}
            </div>
            <p className="text-xs text-muted-foreground">
              Waste diverted
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(mockCollectorStats.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <TrendingUp className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {mockCollectorStats.averageRating}
            </div>
            <p className="text-xs text-muted-foreground">
              {getRatingStars(mockCollectorStats.averageRating)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Pickups & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Active Pickups */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>Active Pickups ({mockCollectorStats.activePickups})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivePickups.map((pickup) => (
                <div key={pickup.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {pickup.scheduledTime}
                      </span>
                    </div>
                    {getStatusBadge(pickup.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="font-medium mb-1">{pickup.customer}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{pickup.address}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <span>{pickup.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{pickup.email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">Estimated KG</p>
                        <p className="font-medium">{pickup.estimatedKg} kg</p>
                      </div>
                      <div className="text-center mb-2">
                        <p className="text-xs text-muted-foreground">Materials</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {pickup.materials.map((material, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {pickup.notes && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-xs">{pickup.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start">
              <Truck className="h-4 w-4 mr-2" />
              Start Collection
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              View Route
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Recycle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Today's Progress</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium">{mockCollectorStats.completedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal:</span>
                  <span className="font-medium">{mockCollectorStats.monthlyProgress}/{mockCollectorStats.monthlyGoal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(mockCollectorStats.monthlyProgress / mockCollectorStats.monthlyGoal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Collections */}
      <Card className="shadow-elegant mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Recycle className="h-5 w-5 text-primary" />
            <span>Recent Collections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentCollections.map((collection) => (
              <div key={collection.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(collection.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {getRatingStars(collection.rating)}
                    </span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Completed
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{collection.customer}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-sm">{collection.address}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">KG Collected</p>
                    <p className="font-medium">{collection.kg}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="font-medium">{formatCurrency(collection.earnings)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Efficiency</h3>
              <p className="text-sm text-muted-foreground">95% on-time completion</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Quality</h3>
              <p className="text-sm text-muted-foreground">98% customer satisfaction</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-1">Growth</h3>
              <p className="text-sm text-muted-foreground">+15% monthly increase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
