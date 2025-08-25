import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Plus,
  Gift,
  Users,
  TrendingUp
} from "lucide-react";

export default function AdminRewards() {
  const mockRewards = [
    {
      id: 1,
      name: "Eco Warrior Badge",
      description: "Awarded for recycling 100kg of materials",
      points: 100,
      type: "badge",
      status: "active",
      usersEarned: 45
    },
    {
      id: 2,
      name: "R50 Voucher",
      description: "Cash voucher for consistent recycling",
      points: 500,
      type: "voucher",
      status: "active",
      usersEarned: 23
    },
    {
      id: 3,
      name: "Premium Member",
      description: "Exclusive benefits for top recyclers",
      points: 1000,
      type: "membership",
      status: "active",
      usersEarned: 12
    }
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'badge':
        return <Badge variant="default" className="bg-blue-500">Badge</Badge>;
      case 'voucher':
        return <Badge variant="default" className="bg-green-500">Voucher</Badge>;
      case 'membership':
        return <Badge variant="default" className="bg-purple-500">Membership</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AdminLayout currentPage="/admin/rewards">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
            <p className="text-gray-600">Manage rewards and incentives for users</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Reward
          </Button>
        </div>

        {/* Rewards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Rewards
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-100">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {mockRewards.length}
              </div>
              <p className="text-xs text-blue-600">
                Active rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {mockRewards.reduce((sum, reward) => sum + reward.usersEarned, 0)}
              </div>
              <p className="text-xs text-green-600">
                Rewards earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Engagement Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-100">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                78%
              </div>
              <p className="text-xs text-yellow-600">
                +5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rewards List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>Available Rewards</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRewards.map((reward) => (
                <div key={reward.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{reward.name}</h3>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(reward.type)}
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Points Required</p>
                      <p className="font-medium">{reward.points} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Users Earned</p>
                      <p className="font-medium">{reward.usersEarned}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reward Type</p>
                      <p className="font-medium capitalize">{reward.type}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Deactivate</Button>
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
                Create New Reward
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Gift className="h-4 w-4 mr-2" />
                Manage Rewards
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                User Rewards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
