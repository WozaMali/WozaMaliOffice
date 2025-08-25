import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Recycle, 
  Calendar, 
  MapPin, 
  Package,
  Search,
  Filter,
  Plus
} from "lucide-react";

export default function AdminCollections() {
  // Mock collections data
  const mockCollections = [
    { 
      id: 1, 
      customer: "John Doe", 
      address: "123 Main St, Cape Town", 
      status: "completed", 
      kg: 15.5, 
      value: 77.50, 
      date: "2024-01-15",
      collector: "Dumisani M.",
      materials: ["Paper", "Plastic", "Glass"]
    },
    { 
      id: 2, 
      customer: "Jane Smith", 
      address: "456 Oak Ave, Johannesburg", 
      status: "in_progress", 
      kg: 8.2, 
      value: 41.00, 
      date: "2024-01-15",
      collector: "Sarah K.",
      materials: ["Paper", "Cardboard"]
    },
    { 
      id: 3, 
      customer: "Bob Wilson", 
      address: "789 Pine Rd, Durban", 
      status: "pending", 
      kg: 12.0, 
      value: 60.00, 
      date: "2024-01-14",
      collector: "Mike T.",
      materials: ["Paper", "Plastic", "Metal"]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  return (
    <AdminLayout currentPage="/admin/collections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collections Management</h1>
            <p className="text-gray-600">Monitor and manage all recycling collections</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search collections..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline">Export</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Recycle className="h-5 w-5 text-green-600" />
              <span>Recent Collections ({mockCollections.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCollections.map((collection) => (
                <div key={collection.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {new Date(collection.date).toLocaleDateString()}
                      </span>
                    </div>
                    {getStatusBadge(collection.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="font-medium">{collection.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Collector</p>
                      <p className="font-medium">{collection.collector}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">KG Collected</p>
                      <p className="font-medium">{collection.kg} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Value</p>
                      <p className="font-medium">{formatCurrency(collection.value)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>{collection.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-1">
                        {collection.materials.map((material, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full justify-start">
                <Recycle className="h-4 w-4 mr-2" />
                Schedule Collection
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Material Reports
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Collection Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
