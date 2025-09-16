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
  Calendar,
  Settings,
  LogOut,
  UserPlus,
  TreePine,
  School,
  Home,
  Crown
} from 'lucide-react';
import { Copy } from 'lucide-react';
import UsersPage from '@/components/admin/UsersPage';
import PickupsPage from '@/components/admin/PickupsPage';
import AnalyticsPage from '@/components/admin/AnalyticsPage';
import PaymentsPage from '@/components/admin/PaymentsPage';
import RewardsPage from '@/components/admin/RewardsPage';
import ResidentSummaryPage from '@/components/admin/ResidentSummaryPage';
import AdminGreenScholarFund from '@/components/admin/AdminGreenScholarFund';
import AddUserModal from '@/components/admin/AddUserModal';
import BeneficiariesPage from './Beneficiaries';
import { NotificationToast } from '@/components/NotificationToast';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationManager } from '@/lib/notificationManager';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ResetTransactionsDialog } from '@/components/ResetTransactionsDialog';
import {
  getPickups, 
  getPayments, 
  getUsers, 
  subscribeToAllChanges,
  testSupabaseConnection,
  getWalletData,
  deleteCollectionDeep,
  RecentActivity
} from '../../src/lib/admin-services';
import { supabase } from '../../src/lib/supabase';
import { UnifiedAdminService, useDashboardData, useAllUsers, useCollections, useTownships, useSubdivisions } from '../../src/lib/unified-admin-service';
import { clearPickupsCache } from '../../src/lib/admin-services';
import type { User, TownshipDropdown, SubdivisionDropdown } from '../../src/lib/supabase';
import type { CollectionData } from '../../src/lib/unified-admin-service';

// Sidebar Navigation Component
function AdminSidebar({ currentPage, onPageChange, onLogout }: { 
  currentPage: string; 
  onPageChange: (page: string) => void;
  onLogout: () => void;
}) {
  const navigation = [
    { name: 'Dashboard', page: 'dashboard', icon: BarChart3 },
    { name: 'Users', page: 'users', icon: Users },
    { name: 'Resident Summary', page: 'tiers', icon: Crown },
    { name: 'Withdrawals', page: 'withdrawals', icon: CreditCard },
    { name: 'Rewards', page: 'rewards', icon: Gift },
    { name: 'Beneficiaries', page: 'beneficiaries', icon: School },
    { name: 'Green Scholar Fund', page: 'green-scholar', icon: TreePine },
    { name: 'Collections', page: 'collections', icon: Calendar },
    { name: 'Pickups', page: 'pickups', icon: Package },
    { name: 'Analytics', page: 'analytics', icon: TrendingUp },
    { name: 'Config', page: 'config', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
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
                  ? 'bg-orange-600 text-white shadow-sm'
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
function DashboardContent({ onPageChange, onAddUser }: { 
  onPageChange: (page: string) => void;
  onAddUser: () => void;
}) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalPickups: 0,
    totalWeight: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingPickups: 0,
    totalPayments: 0,
    pendingPayments: 0,
            totalWallets: 0,
        totalCashBalance: 0,
        totalWalletWeight: 0,
        totalWalletCollections: 0,
        totalCurrentPoints: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        totalLifetimeEarnings: 0,
        walletPermissionError: false,
        walletErrorMessage: ''
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Unified schema hooks
  const { data: unifiedDashboardData, loading: unifiedLoading, error: unifiedError } = useDashboardData();
  const { users: unifiedUsers, loading: usersLoading, error: usersError } = useAllUsers();
  const { collections: unifiedCollections, loading: collectionsLoading, error: collectionsError } = useCollections();

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

      console.log('📊 Loading collections...');
      let collections: any[] = [];
      try {
        const { data: colData, error: colErr } = await supabase
          .from('collections')
          .select('status, total_kg, weight_kg');
        if (colErr) {
          console.error('❌ Error loading collections:', colErr);
        } else {
          collections = colData || [];
          console.log('✅ Collections loaded:', collections.length);
        }
      } catch (collectionsError) {
        console.error('❌ Error loading collections:', collectionsError);
        collections = [];
      }
      
      console.log('📊 Loading payments...');
      let payments: any[] = [];
      try {
        const { data: payData, error: payErr } = await supabase
          .from('payments')
          .select('amount, status');
        if (payErr) {
          console.error('❌ Error loading payments:', payErr);
        } else {
          payments = payData || [];
          console.log('✅ Payments loaded:', payments.length);
        }
      } catch (paymentsError) {
        console.error('❌ Error loading payments:', paymentsError);
        payments = [];
      }

      // Calculate metrics
      const totalPickups = pickups.length;
      const pendingPickups = pickups.filter(p => p.status === 'pending').length;
      
      const totalPayments = payments.length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      
      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setDashboardData(prev => ({
        ...prev,
        totalPickups,
        pendingPickups,
        totalPayments,
        pendingPayments,
        totalRevenue
      }));
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

  // 1) React to unified data availability (no subscriptions here)
  useEffect(() => {
    if (unifiedDashboardData && !unifiedLoading && !unifiedError) {
      setDashboardData({
        totalUsers: unifiedDashboardData.totalUsers,
        totalPickups: unifiedDashboardData.totalCollections,
        totalWeight: unifiedDashboardData.totalWeight,
        totalRevenue: unifiedDashboardData.totalRevenue,
        activeUsers: unifiedDashboardData.totalUsers,
        pendingPickups: unifiedDashboardData.pendingCollections,
        totalPayments: 0,
        pendingPayments: 0,
        totalWallets: unifiedDashboardData.totalWallets,
        totalCashBalance: unifiedDashboardData.totalWalletBalance,
        totalWalletWeight: 0,
        totalWalletCollections: 0,
        totalCurrentPoints: unifiedDashboardData.totalWalletBalance,
        totalPointsEarned: unifiedDashboardData.totalPointsEarned,
        totalPointsSpent: unifiedDashboardData.totalPointsSpent,
        totalLifetimeEarnings: unifiedDashboardData.totalPointsEarned,
        walletPermissionError: false,
        walletErrorMessage: ''
      });
      setLoading(false);
    } else if (!unifiedLoading) {
      loadDashboardData();
      loadRecentActivity();
    }
  }, [unifiedDashboardData, unifiedLoading, unifiedError]);


  // 2) Set up realtime subscriptions once on mount
  useEffect(() => {
    const subscriptions = subscribeToAllChanges({
      pickups: () => {
        console.log('📡 Pickup change detected, reloading dashboard data...');
        loadDashboardData();
      },
      payments: () => {
        console.log('📡 Payment change detected, reloading dashboard data...');
        loadDashboardData();
      },
      users: () => {
        console.log('📡 User change detected, reloading dashboard data...');
        loadDashboardData();
      }
    });

    const collectionsChannel = supabase
      .channel('unified_collections_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unified_collections' }, (payload) => {
        console.log('📡 New collection detected:', payload.new);
        loadDashboardData();
        
        // Trigger notification for new collection
        notificationManager.addNotification({
          type: 'collection',
          title: 'New Collection Submitted',
          message: `Collection from ${payload.new?.customer_name || 'Unknown'} - ${payload.new?.total_weight_kg || 0}kg`
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections' }, () => {
        console.log('📡 Unified collections change, refreshing dashboard...');
        loadDashboardData();
      })
      .subscribe();

    const walletsChannel = supabase
      .channel('wallets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        console.log('📡 Wallets change, refreshing dashboard...');
        loadDashboardData();
      })
      .subscribe();

    // Subscribe to withdrawal requests
    const withdrawalRequestsChannel = supabase
      .channel('withdrawal_requests_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'withdrawal_requests' }, (payload) => {
        console.log('📡 New withdrawal request detected:', payload.new);
        loadDashboardData();
        
        // Trigger notification for new withdrawal request
        notificationManager.addNotification({
          type: 'withdrawal',
          title: 'New Withdrawal Request',
          message: `Withdrawal request for R${payload.new?.amount || 0} from user ${payload.new?.user_id || 'Unknown'}`
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
        console.log('📡 Withdrawal requests change, refreshing dashboard...');
        loadDashboardData();
      })
      .subscribe();

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      collectionsChannel.unsubscribe();
      walletsChannel.unsubscribe();
      withdrawalRequestsChannel.unsubscribe();
    };
  }, []);

  const loadRecentActivity = async () => {
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

      console.log('📊 Loading collections...');
      let collections: any[] = [];
      try {
        const { data: colData, error: colErr } = await supabase
          .from('collections')
          .select('status, total_kg, weight_kg');
        if (colErr) {
          console.error('❌ Error loading collections:', colErr);
        } else {
          collections = colData || [];
          console.log('✅ Collections loaded:', collections.length);
        }
      } catch (collectionsError) {
        console.error('❌ Error loading collections:', collectionsError);
        collections = [];
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

      console.log('📊 Loading wallet data...');
      let walletData: any = null;
      try {
        walletData = await getWalletData();
        console.log('✅ Wallet data loaded:', walletData.totalWallets, 'wallets');
      } catch (walletError) {
        console.error('❌ Error loading wallet data:', walletError);
        walletData = { totalWallets: 0, totalCashBalance: 0, totalWeight: 0, totalCollections: 0 };
      }

      // Resident Summary logic: Total Value is sum of pickups.total_value

      console.log('📊 Dashboard data loaded:', {
        pickups: pickups.length,
        payments: payments.length,
        users: users.length
      });

      // Compute from Office collections first (matches Collection Management / Pickups pages)
      const revenueStatuses = new Set(['approved', 'completed']);
      const hasCollections = Array.isArray(collections) && collections.length > 0;
      const useUnified = !hasCollections && Array.isArray(unifiedCollections) && unifiedCollections.length > 0;

      const totalWeight = hasCollections
        ? (collections as any[])
            .filter((c: any) => revenueStatuses.has(String(c.status || '').toLowerCase()))
            .reduce((sum: number, c: any) => sum + (c.weight_kg ?? c.total_kg ?? 0), 0)
        : useUnified
        ? (unifiedCollections as any[])
            .filter((c: any) => revenueStatuses.has(String(c.status || '').toLowerCase()))
            .reduce((sum: number, c: any) => sum + (c.weight_kg ?? c.total_weight_kg ?? 0), 0)
        : pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0);

      // Total Revenue from unified_collections stored values (all non-rejected)
      // Sum computed_value (fallback total_value). No legacy/wallet fallbacks.
      let totalRevenue = 0;
      let revenueSource = 'unified_collections(stored, all-non-rejected)';
      try {
        const { data: ucRows, error: ucErr } = await supabase
          .from('unified_collections')
          .select('status, computed_value, total_value')
          .neq('status', 'rejected');
        const rows = (!ucErr && Array.isArray(ucRows)) ? ucRows : [];
        totalRevenue = rows.reduce((s: number, r: any) => s + (Number(r.computed_value ?? r.total_value) || 0), 0);
      } catch (_e) {
        // keep totalRevenue at 0 on error
      }

      // Fallback: derive from collection_materials if stored totals are zero
      if (!totalRevenue) {
        try {
          const { data: idsData, error: idsErr } = await supabase
            .from('unified_collections')
            .select('id')
            .neq('status', 'rejected');
          const ids = (!idsErr && Array.isArray(idsData)) ? idsData.map((r: any) => r.id) : [];
          if (ids.length > 0) {
            const { data: mats, error: matsErr } = await supabase
              .from('collection_materials')
              .select('collection_id, quantity, unit_price')
              .in('collection_id', ids);
            if (!matsErr && Array.isArray(mats)) {
              totalRevenue = mats.reduce((sum: number, m: any) => sum + ((Number(m.quantity) || 0) * (Number(m.unit_price) || 0)), 0);
              revenueSource = 'collection_materials(derived)';
            }
          }
        } catch (_e) {
          // ignore and keep totalRevenue as-is
        }
      }

      console.log('🔍 Revenue calculation debug:', { totalRevenue, revenueSource });
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
        pendingPayments,
        totalWallets: walletData?.totalWallets || 0,
        totalCashBalance: walletData?.totalCashBalance || 0,
        totalWalletWeight: walletData?.totalWeight || 0,
        totalWalletCollections: walletData?.totalCollections || 0,
        totalCurrentPoints: walletData?.totalCurrentPoints || 0,
        totalPointsEarned: walletData?.totalPointsEarned || 0,
        totalPointsSpent: walletData?.totalPointsSpent || 0,
        totalLifetimeEarnings: walletData?.totalLifetimeEarnings || 0,
        walletPermissionError: walletData?.permissionError || false,
        walletErrorMessage: walletData?.errorMessage || ''
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


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time system overview and management</p>
        </div>
        <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          Live Data
        </Badge>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {(loading || dashboardData.walletPermissionError ||
          dashboardData.totalWallets > 0 ||
          dashboardData.totalCurrentPoints > 0 ||
          dashboardData.totalPointsEarned > 0 ||
          dashboardData.totalCashBalance > 0) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Point Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dashboardData.walletPermissionError ? (
                <div className="text-center py-2">
                  <div className="text-sm font-medium text-orange-600 mb-1">
                    Permission Required
                  </div>
                  <p className="text-xs text-gray-500">
                    Run FIX_WALLET_PERMISSIONS.sql to enable wallet data access
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {loading ? '...' : dashboardData.totalCurrentPoints.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.totalWallets} wallets • Total points earned
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
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
              onClick={onAddUser}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange('pickups')}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Pickups
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange('rewards')}
            >
              <Gift className="mr-2 h-4 w-4" />
              Configure Rewards
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange('analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline" 
              size="lg"
              onClick={() => onPageChange('withdrawals')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payments
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
  const { users, loading, error } = useAllUsers();
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users Management</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>Error loading users: {error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Residents</h3>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role?.name === 'resident').length}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900">Collectors</h3>
              <p className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.role?.name === 'collector').length}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Township</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role?.name === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role?.name === 'collector' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.township?.name || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawalsContent() {
  return <PaymentsPage />;
}

function RewardsContent() {
  return <RewardsPage />;
}

function TiersContent() {
  return <ResidentSummaryPage />;
}


function CollectionsContent() {
  const { collections, loading, error } = useCollections();
  const [rows, setRows] = useState<typeof collections>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fullNameByEmail, setFullNameByEmail] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedCollectionForReset, setSelectedCollectionForReset] = useState<{ id: string; name: string } | null>(null);

  const getDisplayName = (fullName?: string, email?: string) => {
    const cleaned = (fullName || '').trim();
    if (cleaned) return cleaned;
    const e = (email || '').trim();
    if (!e) return 'Unknown Resident';
    const local = e.split('@')[0];
    const parts = local.replace(/\.+|_+|-+/g, ' ').split(' ').filter(Boolean);
    if (parts.length === 0) return e;
    const cased = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    return cased || e;
  };

  useEffect(() => {
    if (!loading) {
      setRows(collections);
    }
  }, [collections, loading]);

  // Backfill resident and collector names by email if missing
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const emails = Array.from(new Set(
          (rows || [])
            .flatMap((r: any) => [r.customer?.email, r.collector?.email])
            .map(e => (e || '').trim())
            .filter(Boolean)
        ));
        const missing = emails.filter(e => !fullNameByEmail[e]);
        if (missing.length === 0) return;

        const map: Record<string, string> = { ...fullNameByEmail };

        const { data: usersData } = await supabase
          .from('users')
          .select('email, full_name, first_name, last_name')
          .in('email', missing);
        (usersData || []).forEach((u: any) => {
          const v = (u.full_name && String(u.full_name).trim())
            || `${(u.first_name||'').toString().trim()} ${(u.last_name||'').toString().trim()}`.trim();
          if (u.email && v) map[String(u.email)] = v;
        });

        const stillMissing = missing.filter(e => !map[e]);
        if (stillMissing.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .in('email', stillMissing);
          (profilesData || []).forEach((p: any) => {
            if (p.email && p.full_name) map[String(p.email)] = String(p.full_name).trim();
          });
        }

        if (Object.keys(map).length !== Object.keys(fullNameByEmail).length) {
          setFullNameByEmail(map);
        }
      } catch (e) {
        // ignore lookup errors
      }
    };
    fetchNames();
  }, [rows, fullNameByEmail]);

  // (Removed approver backfill per request)

  const handleUpdate = async (collectionId: string, newStatus: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm(`Are you sure you want to mark this collection as ${newStatus}?`) : true;
    if (!confirmed) return;
    try {
      // Optimistic update
      setRows(prev => prev.map(c => c.id === collectionId ? { ...c, status: newStatus as 'pending' | 'submitted' | 'approved' | 'rejected' } : c));
      const { data, error } = await UnifiedAdminService.updateCollectionStatus(collectionId, newStatus);
      if (error || !data) {
        console.error('Error updating collection status:', error);
        // Revert on error
        setRows(prev => prev.map(c => c.id === collectionId ? { ...c, status: (collections.find(x => x.id === collectionId)?.status || c.status) } : c));
        setNotice({ type: 'error', message: 'Failed to update status.' });
        return;
      }
      // Ensure row reflects server response
      setRows(prev => prev.map(c => c.id === collectionId ? { ...c, status: data.status, notes: data.notes } as any : c));
      setNotice({ type: 'success', message: `Status updated to ${data.status}.` });
    } catch (e) {
      console.error('Exception updating collection status:', e);
      // Revert on exception
      setRows(prev => prev.map(c => c.id === collectionId ? { ...c, status: (collections.find(x => x.id === collectionId)?.status || c.status) } : c));
      setNotice({ type: 'error', message: 'Failed to update status.' });
    }
  };

  const openDetails = async (collectionId: string) => {
    try {
      setSelectedId(collectionId);
      setDetailsLoading(true);
      setDetails(null);

      // Fetch collection base data (prefer unified_collections)
      let base = await supabase
        .from('unified_collections')
        .select('*')
        .eq('id', collectionId)
        .maybeSingle();
      if (base.error || !base.data) {
        base = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
          .maybeSingle();
      }

      // Fetch materials with names
      const { data: items } = await supabase
        .from('collection_materials')
        .select('id, quantity, unit_price, material:materials(name)')
        .eq('collection_id', collectionId);

      // Fetch photos
      const { data: photos } = await supabase
        .from('collection_photos')
        .select('*')
        .eq('collection_id', collectionId)
        .order('uploaded_at', { ascending: false });

      setDetails({ base: base.data, items: items || [], photos: photos || [] });
    } catch (e) {
      setNotice({ type: 'error', message: 'Failed to load collection details.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this collection and all related records? This cannot be undone.') : true;
    if (!confirmed) return;
    try {
      // Optimistic remove
      const prevRows = rows;
      setRows(prev => prev.filter(c => c.id !== collectionId));
      const ok = await deleteCollectionDeep(collectionId);
      if (ok) {
        setNotice({ type: 'success', message: 'Collection deleted.' });
        try { clearPickupsCache(); } catch {}
        // Refresh dashboard data after deletion
        // try { await loadDashboardData(); } catch {}
      } else {
        setRows(prevRows);
        setNotice({ type: 'error', message: 'Failed to delete collection.' });
      }
    } catch (e) {
      // Restore on exception
      setRows(prev => prev);
      setNotice({ type: 'error', message: 'Failed to delete collection.' });
    }
  };

  const handleResetTransactions = (collection: any) => {
    setSelectedCollectionForReset({
      id: collection.id,
      name: `${getDisplayName(collection.customer?.full_name, collection.customer?.email)} - ${collection.weight_kg || 0}kg`
    });
    setResetDialogOpen(true);
  };

  const handleResetSuccess = () => {
    setNotice({ type: 'success', message: 'Transactions reset successfully. Collection status updated.' });
    // Refresh the collections data
    window.location.reload(); // Simple refresh for now
  };

  const closeDetails = () => {
    setSelectedId(null);
    setDetails(null);
    setDetailsLoading(false);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Collections Management</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>Error loading collections: {error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notice && (
            <div className={`px-4 py-2 rounded ${notice.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{notice.message}</span>
                <button className="text-xs underline" onClick={() => setNotice(null)}>Dismiss</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Total Collections</h3>
              <p className="text-2xl font-bold text-blue-600">{rows.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {rows.filter(c => c.status === 'pending' || c.status === 'submitted').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Approved</h3>
              <p className="text-2xl font-bold text-green-600">
                {rows.filter(c => c.status === 'approved').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900">Rejected</h3>
              <p className="text-2xl font-bold text-red-600">
                {rows.filter(c => c.status === 'rejected').length}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Collections</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (R/kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (R)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            title={collection.id}
                            className="text-sm font-medium text-gray-900"
                          >
                            {collection.id.substring(0, 8)}...
                          </span>
                          <button
                            type="button"
                            title="Copy full Collection ID"
                            aria-label="Copy full Collection ID"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(collection.id);
                                setNotice({ type: 'success', message: 'Collection ID copied to clipboard.' });
                              } catch (e) {
                                setNotice({ type: 'error', message: 'Failed to copy Collection ID.' });
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fullNameByEmail[collection.customer?.email || ''] || getDisplayName(collection.customer?.full_name, collection.customer?.email) || 'Unknown Resident'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {collection.customer?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fullNameByEmail[collection.collector?.email || ''] || getDisplayName(collection.collector?.full_name, collection.collector?.email) || 'Unassigned'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {collection.collector?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {collection.material_type || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {collection.weight_kg || 0} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          R{collection.material_rate_per_kg?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          R{collection.computed_value?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          collection.status === 'approved' ? 'bg-green-100 text-green-800' :
                          collection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {collection.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(collection.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {(collection.status === 'pending' || collection.status === 'submitted') && (
                            <>
                              <button className="text-green-600 hover:text-green-900" onClick={() => handleUpdate(collection.id, 'approved')}>
                                Approve
                              </button>
                              <button className="text-red-600 hover:text-red-900" onClick={() => handleUpdate(collection.id, 'rejected')}>
                                Reject
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900" onClick={() => openDetails(collection.id)}>
                            View
                          </button>
                          {collection.status === 'approved' && (
                            <button 
                              className="text-orange-600 hover:text-orange-900" 
                              onClick={() => handleResetTransactions(collection)}
                              title="Reset transactions for this collection"
                            >
                              Reset
                            </button>
                          )}
                          <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(collection.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetails} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 text-gray-900">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Collection Details</h3>
              <button onClick={closeDetails} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">Loading…</div>
              ) : !details ? (
                <div className="text-center py-8 text-red-600">Failed to load details.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-800">Collection ID</div>
                      <div className="font-medium break-all">{details.base?.id}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Status</div>
                      <div className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {details.base?.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-800">Customer</div>
                      <div className="font-medium">{details.base?.customer_name || details.base?.user_id || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Collector</div>
                      <div className="font-medium">{details.base?.collector_name || details.base?.collector_id || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Created</div>
                      <div className="font-medium">{details.base?.created_at ? new Date(details.base.created_at).toLocaleString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Total Weight (kg)</div>
                      <div className="font-medium">{details.base?.total_weight_kg ?? details.base?.weight_kg ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Total Value (R)</div>
                      <div className="font-medium">{Number(details.base?.total_value ?? details.base?.computed_value ?? 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Materials</div>
                    {details.items?.length === 0 ? (
                      <div className="text-sm text-gray-500">No materials recorded.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-800">
                              <th className="py-2 pr-4">Material</th>
                              <th className="py-2 pr-4">Quantity (kg)</th>
                              <th className="py-2 pr-4">Unit Price</th>
                              <th className="py-2">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.items.map((it: any) => (
                              <tr key={it.id} className="border-t">
                                <td className="py-2 pr-4">{it.material?.name || '—'}</td>
                                <td className="py-2 pr-4">{Number(it.quantity || 0).toFixed(2)}</td>
                                <td className="py-2 pr-4">{Number(it.unit_price || 0).toFixed(2)}</td>
                                <td className="py-2">{(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold mb-2">Photos</div>
                    {details.photos?.length === 0 ? (
                      <div className="text-sm text-gray-500">No photos uploaded.</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {details.photos.map((ph: any) => (
                          <a key={ph.id} href={ph.photo_url} target="_blank" rel="noreferrer" className="block">
                            <img src={ph.photo_url} alt={ph.photo_type || 'photo'} className="w-full h-24 object-cover rounded" />
                            <div className="text-xs text-gray-500 mt-1">{ph.photo_type || 'photo'}</div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={closeDetails} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Transactions Dialog */}
      {selectedCollectionForReset && (
        <ResetTransactionsDialog
          isOpen={resetDialogOpen}
          onClose={() => {
            setResetDialogOpen(false);
            setSelectedCollectionForReset(null);
          }}
          collectionId={selectedCollectionForReset.id}
          collectionName={selectedCollectionForReset.name}
          onSuccess={handleResetSuccess}
        />
      )}
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
      <div className="space-y-6">
        <NotificationSettings />
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              Additional system configuration options will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const { notifications, removeNotification } = useNotifications();

  useEffect(() => {
    setIsClient(true);
    console.log('AdminDashboardClient: isClient set to true');
  }, []);



  // Check authentication and admin/super_admin role
  useEffect(() => {
    if (!isClient || authLoading) return;
    const email = user?.email?.toLowerCase?.() || '';
    const role = profile?.role?.toLowerCase?.();
    const isPrivileged = role === 'admin' || role === 'super_admin' || email === 'admin@wozamali.com';
    if (!user || !isPrivileged) {
      console.log('AdminDashboardClient: User not authenticated or not privileged, redirecting to login');
      router.push('/admin-login');
    }
  }, [isClient, user, profile, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin-login');
  };

  // Show loading state during SSR or initial load.
  // If a user is already present, don't block on authLoading to avoid a stuck spinner.
  if (!isClient || (authLoading && !user)) {
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

  // Check if user is authenticated and has admin/super_admin role
  const email = user?.email?.toLowerCase?.() || '';
  const role = profile?.role?.toLowerCase?.();
  const isPrivileged = role === 'admin' || role === 'super_admin' || email === 'admin@wozamali.com';
  if (!user || !isPrivileged) {
    console.log('AdminDashboardClient: Access denied, redirecting to login');
    return null;
  }

  console.log('AdminDashboardClient: Rendering dashboard for admin user:', profile?.email || user?.email);

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent onPageChange={setCurrentPage} onAddUser={() => setShowAddUserModal(true)} />;
      case 'users':
        return <UsersContent />;
      case 'withdrawals':
        return <WithdrawalsContent />;
      case 'rewards':
        return <RewardsContent />;
      case 'tiers':
        return <TiersContent />;
      case 'beneficiaries':
        return <BeneficiariesPage />;
      case 'green-scholar':
        return <AdminGreenScholarFund />;
      case 'collections':
        return <CollectionsContent />;
      case 'pickups':
        return <PickupsContent />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'config':
        return <ConfigContent />;
      default:
        return <DashboardContent onPageChange={setCurrentPage} onAddUser={() => setShowAddUserModal(true)} />;
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
            <div className="flex items-center gap-4" />
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm text-gray-900 border-gray-300">
                <Building2 className="w-4 h-4 mr-1" />
                Admin: {(profile?.full_name || user?.email || 'Admin')}
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

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          // Refresh dashboard data when a new user is created
          // loadDashboardData();
          // loadRecentActivity();
        }}
      />

      {/* Notification Toasts */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
