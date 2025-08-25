import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp,
  Plus,
  Download,
  Calendar
} from "lucide-react";

export default function AdminFund() {
  const mockFunds = [
    {
      id: 1,
      name: "Main Operating Fund",
      balance: 125000,
      type: "operating",
      status: "active",
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      name: "Emergency Reserve",
      balance: 50000,
      type: "reserve",
      status: "active",
      lastUpdated: "2024-01-14"
    },
    {
      id: 3,
      name: "Investment Fund",
      balance: 75000,
      type: "investment",
      status: "active",
      lastUpdated: "2024-01-13"
    }
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'operating':
        return <Badge variant="default" className="bg-blue-500">Operating</Badge>;
      case 'reserve':
        return <Badge variant="default" className="bg-green-500">Reserve</Badge>;
      case 'investment':
        return <Badge variant="default" className="bg-purple-500">Investment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  return (
    <AdminLayout currentPage="/admin/fund">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fund Management</h1>
            <p className="text-gray-600">Monitor and manage financial funds</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Fund
          </Button>
        </div>

        {/* Fund Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Balance
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(mockFunds.reduce((sum, fund) => sum + fund.balance, 0))}
              </div>
              <p className="text-xs text-green-600">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Funds
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {mockFunds.length}
              </div>
              <p className="text-xs text-blue-600">
                All funds operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Growth
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                12.5%
              </div>
              <p className="text-xs text-yellow-600">
                Positive trend
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funds List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Fund Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockFunds.map((fund) => (
                <div key={fund.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{fund.name}</h3>
                      <p className="text-sm text-gray-500">Last updated: {new Date(fund.lastUpdated).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(fund.type)}
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Current Balance</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(fund.balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fund Type</p>
                      <p className="font-medium capitalize">{fund.type}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline">View Transactions</Button>
                    <Button size="sm" variant="outline">Edit Fund</Button>
                    <Button size="sm" variant="outline">Transfer</Button>
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
                <Plus className="h-4 w-4 mr-2" />
                Create New Fund
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
