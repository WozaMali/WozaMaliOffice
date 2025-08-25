import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  CheckCircle,
  XCircle,
  Clock,
  Download
} from "lucide-react";

export default function AdminWithdrawals() {
  const mockWithdrawals = [
    {
      id: 1,
      user: "John Doe",
      email: "john@example.com",
      amount: 150.00,
      method: "bank_transfer",
      status: "pending",
      requestDate: "2024-01-15",
      accountNumber: "****1234"
    },
    {
      id: 2,
      user: "Jane Smith",
      email: "jane@example.com",
      amount: 75.50,
      method: "mobile_money",
      status: "approved",
      requestDate: "2024-01-14",
      accountNumber: "082****567"
    },
    {
      id: 3,
      user: "Bob Wilson",
      email: "bob@example.com",
      amount: 200.00,
      method: "bank_transfer",
      status: "rejected",
      requestDate: "2024-01-13",
      accountNumber: "****5678"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="default" className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Bank Transfer</Badge>;
      case 'mobile_money':
        return <Badge variant="outline" className="border-green-500 text-green-700">Mobile Money</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const formatCurrency = (num: number) => {
    return `R ${num.toLocaleString()}`;
  };

  return (
    <AdminLayout currentPage="/admin/withdrawals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
            <p className="text-gray-600">Review and process withdrawal requests</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Withdrawal Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pending
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {mockWithdrawals.filter(w => w.status === 'pending').length}
              </div>
              <p className="text-xs text-yellow-600">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Amount
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(mockWithdrawals.reduce((sum, w) => sum + w.amount, 0))}
              </div>
              <p className="text-xs text-blue-600">
                All requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Processed Today
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                8
              </div>
              <p className="text-xs text-green-600">
                Successfully processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Withdrawal Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{withdrawal.user}</h3>
                      <p className="text-sm text-gray-500">{withdrawal.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(withdrawal.status)}
                      {getMethodBadge(withdrawal.method)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Request Date</p>
                      <p className="font-medium">{new Date(withdrawal.requestDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account</p>
                      <p className="font-medium">{withdrawal.accountNumber}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {withdrawal.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">View Details</Button>
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
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All Pending
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
