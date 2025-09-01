'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Package,
  Users,
  BarChart3,
  Plus,
  Camera,
  MapPin,
  Clock,
  Wallet,
  Gift,
  TrendingUp,
  Building2,
  CreditCard,
  TreePine,
  Calendar,
  Settings,
  LogOut,
  UserPlus
} from 'lucide-react';
import UsersPage from '@/components/admin/UsersPage';
import PickupsPage from '@/components/admin/PickupsPage';
import AnalyticsPage from '@/components/admin/AnalyticsPage';
import PaymentsPage from '@/components/admin/PaymentsPage';
import { 
  getPickups, 
  getPayments, 
  getUsers, 
  subscribeToAllChanges,
  testSupabaseConnection,
  getAdminDashboardData,
  getRecentActivity,
  RecentActivity
} from '../../src/lib/admin-services';

// Sidebar Navigation Component
function AdminSidebar({ currentPage, onPageChange, onLogout }: { 
  currentPage: string; 
  onPageChange: (page: string) => void;
  onLogout: () => void;
}) {
  const navigation = [
    { name: 'Dashboard', page: 'dashboard', icon: BarChart3 },
    { name: 'Users', page: 'users', icon: Users },
    { name: 'Withdrawals', page: 'withdrawals', icon: CreditCard },
    { name: 'Rewards', page: 'rewards', icon: Gift },
    { name: 'Green Scholar Fund', page: 'fund', icon: TreePine },
    { name: 'Collections', page: 'collections', icon: Calendar },
    { name: 'Pickups', page: 'pickups', icon: Package },
    { name: 'Analytics', page: 'analytics', icon: TrendingUp },
    { name: 'Config', page: 'config', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <img 
            src="/w yellow.png" 
            alt="Woza Mali Logo" 
            className="w-8 h-8"
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Woza Mali</h2>
          <p className="text-xs text-gray-500">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.name}
              onClick={() => onPageChange(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-8">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Main Dashboard Content
function DashboardContent() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalPickups: 0,
    totalWeight: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingPickups: 0,
    totalPayments: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadRecentActivity();
    
    // Subscribe to real-time updates
    const subscriptions = subscribeToAllChanges({
      pickups: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadDashboardData(); // Reload data when pickups change
        }
      },
      payments: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadDashboardData(); // Reload data when payments change
        }
      },
      users: (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadDashboardData(); // Reload data when users change
        }
      }
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data...');
      setLoading(true);
      
      // Test connection first
      console.log('🔌 Testing Supabase connection...');
      const connectionTest = await testSupabaseConnection();
      console.log('🔌 Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        throw new Error(`Connection test failed: ${JSON.stringify(connectionTest.error)}`);
      }
      
      // Load data individually to catch specific errors
      console.log('📊 Loading pickups...');
      let pickups: any[] = [];
      try {
        pickups = await getPickups();
        console.log('✅ Pickups loaded:', pickups.length);
      } catch (pickupError) {
        console.error('❌ Error loading pickups:', pickupError);
        pickups = []; // Set empty array as fallback
      }
      
      console.log('📊 Loading payments...');
      let payments: any[] = [];
      try {
        payments = await getPayments();
        console.log('✅ Payments loaded:', payments.length);
      } catch (paymentError) {
        console.error('❌ Error loading payments:', paymentError);
        payments = []; // Set empty array as fallback
      }
      
      console.log('📊 Loading users...');
      let users: any[] = [];
      try {
        users = await getUsers();
        console.log('✅ Users loaded:', users.length);
      } catch (userError) {
        console.error('❌ Error loading users:', userError);
        users = []; // Set empty array as fallback
      }

      console.log('📊 Dashboard data loaded:', {
        pickups: pickups.length,
        payments: payments.length,
        users: users.length
      });

      const totalWeight = pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0);
      const totalRevenue = pickups.reduce((sum, p) => sum + (p.total_value || 0), 0);
      const pendingPickups = pickups.filter(p => p.status === 'submitted').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const activeUsers = users.filter(u => u.is_active).length;

      console.log('📈 Calculated stats:', {
        totalWeight,
        totalRevenue,
        pendingPickups,
        pendingPayments,
        activeUsers
      });

      setDashboardData({
        totalUsers: users.length,
        totalPickups: pickups.length,
        totalWeight,
        totalRevenue,
        activeUsers,
        pendingPickups,
        totalPayments: payments.length,
        pendingPayments
      });
    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      console.log('🔄 Loading recent activity...');
      const activity = await getRecentActivity();
      console.log('✅ Recent activity loaded:', activity.length);
      setRecentActivity(activity);
    } catch (error) {
      console.error('❌ Error loading recent activity:', error);
      setRecentActivity([]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time system overview and management</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Live Data
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.totalPickups.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending: {dashboardData.pendingPickups}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.totalWeight >= 1000 
                ? `${(dashboardData.totalWeight / 1000).toFixed(1)} tons`
                : `${dashboardData.totalWeight.toFixed(1)} kg`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Recycled material
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `R ${dashboardData.totalRevenue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : dashboardData.pendingPickups}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.totalPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : dashboardData.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              size="lg"
              onClick={() => router.push('/admin/users')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/admin/pickups')}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Pickups
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/admin/rewards')}
            >
              <Gift className="mr-2 h-4 w-4" />
              Configure Rewards
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/admin/analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading recent activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No recent activity</div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'pickup_approved' ? 'bg-green-500' :
                    activity.type === 'pickup_rejected' ? 'bg-red-500' :
                    activity.type === 'pickup_created' ? 'bg-blue-500' :
                    activity.type === 'user_registered' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Other Page Content Components
function UsersContent() {
  return <UsersPage />;
}

function WithdrawalsContent() {
  return <PaymentsPage />;
}

function RewardsContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Rewards System</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            Rewards system interface will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FundContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Green Scholar Fund</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            Green Scholar Fund management interface will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CollectionsContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Collections Management</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            Collections management interface will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PickupsContent() {
  return <PickupsPage />;
}

function AnalyticsContent() {
  return <AnalyticsPage />;
}

function ConfigContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">System Configuration</h1>
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            System configuration interface will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    setIsClient(true);
    console.log('AdminDashboardClient: isClient set to true');
  }, []);

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && (!user || !profile || profile.role !== 'admin')) {
      console.log('AdminDashboardClient: User not authenticated or not admin, redirecting to login');
      router.push('/admin-login');
    }
  }, [user, profile, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin-login');
  };

  // Show loading state during SSR or initial load
  if (!isClient || authLoading) {
    console.log('AdminDashboardClient: Showing loading state', { isClient, authLoading });
    
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has admin role
  if (!user || !profile || profile.role !== 'admin') {
    console.log('AdminDashboardClient: Access denied, redirecting to login');
    router.push('/admin-login');
    return null;
  }

  console.log('AdminDashboardClient: Rendering dashboard for admin user:', profile.email);

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UsersContent />;
      case 'withdrawals':
        return <WithdrawalsContent />;
      case 'rewards':
        return <RewardsContent />;
      case 'fund':
        return <FundContent />;
      case 'collections':
        return <CollectionsContent />;
      case 'pickups':
        return <PickupsContent />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'config':
        return <ConfigContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="sm"
              >
                ← Back to Main System
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <Building2 className="w-4 h-4 mr-1" />
                Admin: {profile.full_name}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Live Data
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="bg-gray-50 min-h-screen">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
}
