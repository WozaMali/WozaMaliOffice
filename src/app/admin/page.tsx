'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  Recycle, 
  Award, 
  CreditCard, 
  TreePine,
  Cog,
  UserPlus,
  Shield
} from 'lucide-react';
import AdminTeamMember from '@/components/admin/AdminTeamMember';
import { useAuth } from '@/hooks/use-auth';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('team-members');

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'SUPER_ADMIN';

  const navigationItems = [
    { id: 'team-members', name: 'Team Members', icon: Users, description: 'Manage admin profiles and approve collectors' },
    { id: 'users', name: 'Users', icon: Users, description: 'Manage system users' },
    { id: 'collections', name: 'Collections', icon: Recycle, description: 'View collection data' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, description: 'View system analytics' },
    { id: 'rewards', name: 'Rewards', icon: Award, description: 'Manage rewards system' },
    { id: 'withdrawals', name: 'Withdrawals', icon: CreditCard, description: 'Process withdrawals' },
    { id: 'fund', name: 'Fund Management', icon: TreePine, description: 'Manage green scholar fund' },
    { id: 'config', name: 'Configuration', icon: Cog, description: 'System configuration' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome, {profile?.full_name || 'Admin'}! Manage your system from here.
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">Super Administrator</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R0</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Collectors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              +0 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {navigationItems.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="team-members" className="space-y-4">
          <AdminTeamMember />
        </TabsContent>

        {/* Other Tabs - Placeholder Content */}
        {navigationItems.filter(item => item.id !== 'team-members').map((item) => (
          <TabsContent key={item.id} value={item.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{item.description}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    This section is under development. The {item.name.toLowerCase()} functionality will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
