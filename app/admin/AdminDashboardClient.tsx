'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { usePwaLock } from '@/hooks/use-pwa-lock';

// Helper function to check if user has admin privileges
const isAdminUser = (user: any, profile: any) => {
  if (!user) return false;
  
  // Check profile role first (from database)
  if (profile?.role) {
    const role = profile.role.toLowerCase();
    return ['admin', 'super_admin', 'superadmin'].includes(role);
  }
  
  // Special case: superadmin@wozamali.co.za should always be treated as super admin
  const email = user.email?.toLowerCase() || '';
  if (email === 'superadmin@wozamali.co.za') {
    return true;
  }
  
  // Fallback to other admin emails
  return email === 'admin@wozamali.com' || 
         email.includes('admin@wozamali');
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Shield,
  CreditCard,
  Calendar,
  Settings,
  LogOut,
  UserPlus,
  TreePine,
  School,
  Home,
  Crown,
  Check,
  X,
  UserCheck
} from 'lucide-react';
import { Copy } from 'lucide-react';
import UsersPage from '@/components/admin/UsersPage';
import PickupsPage from '@/components/admin/PickupsPage';
import AnalyticsPage from '@/components/admin/AnalyticsPage';
import PaymentsPage from '@/components/admin/PaymentsPage';
import RewardsPage from '@/components/admin/RewardsPage';
import ResidentSummaryPage from '@/components/admin/ResidentSummaryPage';
import AdminGreenScholarFund from '@/components/admin/AdminGreenScholarFund';
import AddUserModal from './AddUserModalSimple';
import BeneficiariesPage from './Beneficiaries';
import { NotificationToast } from '@/components/NotificationToast';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationManager } from '@/lib/notificationManager';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ResetTransactionsDialog } from '@/components/ResetTransactionsDialog';
import RealtimeStatusDot from '@/components/RealtimeStatusDot';
import TransactionsPage from '@/components/TransactionsPage';
import AdminSettingsPage from '../../src/app/admin/settings/page';
import TeamMembersPage from '../../src/app/admin/team-members/page';
import { RoleBasedAccess } from '../../src/lib/role-based-access';
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
import { softDeleteCollection } from '../../src/lib/soft-delete-service';
import { supabase } from '../../src/lib/supabase';
import { realtimeManager } from '../../src/lib/realtimeManager';
import { UnifiedAdminService, useDashboardData, useAllUsers, useCollections, useTownships, useSubdivisions } from '../../src/lib/unified-admin-service';
import { clearPickupsCache } from '../../src/lib/admin-services';
import type { User, TownshipDropdown, SubdivisionDropdown } from '../../src/lib/supabase';
import type { CollectionData } from '../../src/lib/unified-admin-service';
import { logAdminSessionEvent } from '../../src/lib/admin-session-logging';

// Sidebar Navigation Component
function AdminSidebar({ currentPage, onPageChange }: { 
  currentPage: string; 
  onPageChange: (page: string) => void;
}) {
  const { user, profile, logout } = useAuth();
  const emailLower = user?.email?.toLowerCase?.() || '';
  const isSuperAdmin = RoleBasedAccess.isSuperAdmin(profile as any) || emailLower === 'superadmin@wozamali.co.za';

  // Build navigation in requested order (Team Members appears after Users for superadmin only)
  const baseNavigation = [
    { name: 'Dashboard', page: 'dashboard', icon: BarChart3 },
    { name: 'Collections', page: 'collections', icon: Calendar },
    { name: 'Pickups', page: 'pickups', icon: Package },
    { name: 'Withdrawals', page: 'withdrawals', icon: CreditCard },
    { name: 'Rewards', page: 'rewards', icon: Gift },
    { name: 'Green Scholar Fund', page: 'green-scholar', icon: TreePine },
    { name: 'Beneficiaries', page: 'beneficiaries', icon: School },
    { name: 'Transactions', page: 'transactions', icon: Wallet },
    { name: 'Resident Summary', page: 'tiers', icon: Crown },
    { name: 'Users', page: 'users', icon: Users },
    { name: 'Analytics', page: 'analytics', icon: TrendingUp },
    { name: 'Settings', page: 'settings', icon: Settings },
    { name: 'Config', page: 'config', icon: Settings },
  ];

  const navigation = (() => {
    const items = [...baseNavigation];
    if (isSuperAdmin) {
      const usersIndex = items.findIndex(i => i.page === 'users');
      const insertIndex = usersIndex >= 0 ? usersIndex + 1 : items.length;
      items.splice(insertIndex, 0, { name: 'Team Members', page: 'team-members', icon: UserPlus });
      // Add Admin Activity page for superadmins
      items.splice(insertIndex + 1, 0, { name: 'Admin Activity', page: 'admin-activity', icon: Activity });
    }
    return items;
  })();

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 min-h-screen p-4 shadow-2xl">
      {/* Logo + Realtime status */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
            <img 
              src="/w yellow.png" 
              alt="Woza Mali Logo" 
              className="w-8 h-8"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Woza Mali</h2>
            <p className="text-xs text-gray-300">Admin Portal</p>
          </div>
        </div>
        <RealtimeStatusDot />
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.name}
              onClick={() => onPageChange(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:shadow-md'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <button
          onClick={async () => {
            try {
              await logout();
            } catch {}
            try { window.location.href = '/admin-login'; } catch {}
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-200 hover:text-white hover:bg-gradient-to-r hover:from-red-700 hover:to-red-600 transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// Main Dashboard Content
function DashboardContent({ onPageChange, onAddUser, isSuperAdmin, softOpen, setSoftOpen, softReason, setSoftReason }: { 
  onPageChange: (page: string) => void;
  onAddUser: () => void;
  isSuperAdmin?: boolean;
  softOpen: boolean;
  setSoftOpen: (open: boolean) => void;
  softReason: string;
  setSoftReason: (reason: string) => void;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
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
      let collections: { status: any; total_weight_kg: any; computed_value: any }[] = [];
      try {
        // Try unified_collections first, then fallback to collections
        const unifiedResult = await supabase
          .from('unified_collections')
          .select('status, total_weight_kg, computed_value');

        if (!unifiedResult.error && Array.isArray(unifiedResult.data)) {
          collections = unifiedResult.data as any;
        } else {
          const fallbackResult = await supabase
            .from('collections')
            .select('status, total_weight_kg, total_value');

          if (!fallbackResult.error && Array.isArray(fallbackResult.data)) {
            collections = fallbackResult.data.map((row: any) => ({
              status: row.status,
              total_weight_kg: row.total_weight_kg,
              computed_value: row.total_value ?? 0,
            }));
          } else if (fallbackResult.error) {
            console.error('❌ Error loading collections:', fallbackResult.error);
          }
        }

        console.log('✅ Collections loaded:', collections.length);
      } catch (collectionsError) {
        console.error('❌ Error loading collections:', collectionsError);
        collections = [];
      }
      
      console.log('📊 Loading payments...');
      let payments: any[] = [];
      try {
        // Try payments table first, then fallback to cash_payments
        let { data: payData, error: payErr } = await supabase
          .from('payments')
          .select('amount, status');
        
        if (payErr && payErr.code === 'PGRST205') {
          // Fallback to cash_payments table
          const fallbackResult = await supabase
            .from('cash_payments')
            .select('amount, status');
          payData = fallbackResult.data;
          payErr = fallbackResult.error;
        }
        
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
    // Auto-resume: when tab becomes visible or network is back, force reconnect and refresh data
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        realtimeManager.reconnectNow()
        loadDashboardData()
      }
    }
    const onOnline = () => {
      realtimeManager.reconnectNow()
      loadDashboardData()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)

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

    realtimeManager.subscribe('unified_collections_changes', (channel) => {
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unified_collections' }, (payload: any) => {
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
    })

    realtimeManager.subscribe('wallets_changes', (channel) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        console.log('📡 Wallets change, refreshing dashboard...');
        loadDashboardData();
      })
    })

    // Subscribe to withdrawal requests
    realtimeManager.subscribe('withdrawal_requests_changes', (channel) => {
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'withdrawal_requests' }, (payload: any) => {
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
    })

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      subscriptions.forEach((sub: any) => {
        if (typeof sub === 'function') {
          try { sub() } catch {}
        } else if (sub?.unsubscribe) {
          try { sub.unsubscribe() } catch {}
        }
      });
      realtimeManager.unsubscribe('unified_collections_changes');
      realtimeManager.unsubscribe('wallets_changes');
      realtimeManager.unsubscribe('withdrawal_requests_changes');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      <div className="w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              {isSuperAdmin 
                ? 'Full system access with advanced administrative privileges' 
                : 'Real-time system overview and management'
              }
            </p>
        </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Total Pickups</CardTitle>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">
              {loading ? '...' : dashboardData.totalPickups.toLocaleString()}
            </div>
              <p className="text-sm text-blue-700 font-medium">
              Pending: {dashboardData.pendingPickups}
            </p>
          </CardContent>
        </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-900">Total Weight</CardTitle>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">
              {loading ? '...' : dashboardData.totalWeight >= 1000 
                ? `${(dashboardData.totalWeight / 1000).toFixed(1)} tons`
                : `${dashboardData.totalWeight.toFixed(1)} kg`
              }
            </div>
              <p className="text-sm text-green-700 font-medium">
              Recycled material
            </p>
          </CardContent>
        </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-yellow-900">Active Users</CardTitle>
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
              {loading ? '...' : dashboardData.activeUsers.toLocaleString()}
            </div>
              <p className="text-sm text-yellow-700 font-medium">
              Active accounts
            </p>
          </CardContent>
        </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-900">Total Revenue</CardTitle>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">
              {loading ? '...' : `R ${dashboardData.totalRevenue.toLocaleString()}`}
            </div>
              <p className="text-sm text-orange-700 font-medium">
              Generated value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Soft Sign Out Dialog */}
      <Dialog open={softOpen} onOpenChange={setSoftOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-gray-900">Soft Sign Out</DialogTitle>
            <DialogDescription className="text-gray-600">Select a reason and confirm soft sign out.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-800">Select Reason</label>
              <select
                value={softReason}
                onChange={(e) => setSoftReason(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white text-gray-800 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
              >
                <option>Tea Break</option>
                <option>Lunch</option>
                <option>Bathroom</option>
                <option>Meeting</option>
                <option>Site Visit</option>
                <option>Network Issue</option>
                <option>End of Shift</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setSoftOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="relative overflow-hidden bg-gradient-to-b from-yellow-400 to-yellow-500 text-yellow-950 border-0 shadow-[0_6px_0_#b45309] hover:shadow-[0_4px_0_#b45309] active:shadow-[0_0_0_#b45309] active:translate-y-1 transition-all duration-150 px-4 py-2 rounded-md"
                onClick={async () => {
                  try {
                    await logAdminSessionEvent(user?.id, 'soft_logout', softReason);
                    setSoftOpen(false);
                    // Also clear session storage to ensure lock state
                    try {
                      sessionStorage.removeItem('pwaLock.unlockedSession');
                    } catch {}
                    // Force immediate refresh to trigger unlock card
                    window.location.reload();
                  } catch {}
                }}
              >
                <span className="relative z-10 font-semibold">Submit</span>
                <span className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,white,transparent_40%)]" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-yellow-900">Pending Pickups</CardTitle>
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
              {loading ? '...' : dashboardData.pendingPickups}
            </div>
              <p className="text-sm text-yellow-700 font-medium">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-indigo-900">Total Payments</CardTitle>
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-indigo-600 mb-1">
              {loading ? '...' : dashboardData.totalPayments}
            </div>
              <p className="text-sm text-indigo-700 font-medium">
              Processed
            </p>
          </CardContent>
        </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-900">Pending Payments</CardTitle>
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-1">
              {loading ? '...' : dashboardData.pendingPayments}
            </div>
              <p className="text-sm text-red-700 font-medium">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        {(loading || dashboardData.walletPermissionError ||
          dashboardData.totalWallets > 0 ||
          dashboardData.totalCurrentPoints > 0 ||
          dashboardData.totalPointsEarned > 0 ||
          dashboardData.totalCashBalance > 0) && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-900">Total Point Balance</CardTitle>
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
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
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {loading ? '...' : dashboardData.totalCurrentPoints.toLocaleString()}
                  </div>
                    <p className="text-sm text-emerald-700 font-medium">
                    {dashboardData.totalWallets} wallets • Total points earned
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">Common admin tasks</CardDescription>
          </CardHeader>
            <CardContent className="p-6 space-y-3">
            <Button 
                className="w-full justify-start bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={onAddUser}
            >
                <UserPlus className="mr-3 h-5 w-5" />
              Add New User
            </Button>
            <Button 
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={() => onPageChange('pickups')}
            >
                <Package className="mr-3 h-5 w-5" />
              Manage Pickups
            </Button>
            <Button 
                className="w-full justify-start bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={() => onPageChange('rewards')}
            >
                <Gift className="mr-3 h-5 w-5" />
              Configure Rewards
            </Button>
            <Button 
                className="w-full justify-start bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={() => onPageChange('analytics')}
            >
                <BarChart3 className="mr-3 h-5 w-5" />
              View Reports
            </Button>
            <Button 
                className="w-full justify-start bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={() => onPageChange('users')}
            >
                <Users className="mr-3 h-5 w-5" />
              Manage Users
            </Button>
            <Button 
                className="w-full justify-start bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
              onClick={() => onPageChange('withdrawals')}
            >
                <CreditCard className="mr-3 h-5 w-5" />
              Process Payments
            </Button>
          </CardContent>
        </Card>

          {/* Super Admin Features */}
          {isSuperAdmin && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-xl">
                  <Crown className="w-6 h-6 mr-3" />
                  Super Admin Tools
                </CardTitle>
                <CardDescription className="text-green-100">
                  Advanced administrative functions
                </CardDescription>
          </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                  onClick={() => onPageChange('config')}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  System Configuration
                </Button>
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                  onClick={() => onPageChange('transactions')}
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  Transaction Management
                </Button>
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                  onClick={() => onPageChange('analytics')}
                >
                  <TrendingUp className="mr-3 h-5 w-5" />
                  Advanced Analytics
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-gray-300">Latest system activities</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
            {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  Loading recent activity...
                </div>
            ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">No recent activity</p>
                  <p className="text-sm">System activities will appear here</p>
                </div>
            ) : (
              recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${
                    activity.type === 'pickup_approved' ? 'bg-green-500' :
                    activity.type === 'pickup_rejected' ? 'bg-red-500' :
                    activity.type === 'pickup_created' ? 'bg-blue-500' :
                    activity.type === 'user_registered' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

// Other Page Content Components
function AdminActivityContent() {
  type AdminEvent = {
    id: string;
    user_id: string;
    event_type: 'login' | 'logout' | 'soft_logout' | 'unlock';
    reason: string | null;
    created_at: string;
    user_email?: string | null;
  };

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'login' | 'logout' | 'soft_logout' | 'unlock'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_admin_session_events', { p_limit: 200 });
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      const ids = Array.from(new Set(list.map((e: any) => e.user_id).filter(Boolean)));
      const emailMap = new Map<string, string>();
      if (ids.length) {
        const { data: usersData } = await supabase.from('users').select('id,email').in('id', ids);
        (usersData || []).forEach((u: any) => emailMap.set(u.id, u.email || ''));
      }
      const mapped: AdminEvent[] = list.map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        event_type: e.event_type,
        reason: e.reason ?? null,
        created_at: e.created_at,
        user_email: emailMap.get(e.user_id) || null,
      }));
      setEvents(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleEvents = events.filter(ev => (filter === 'all' ? true : ev.event_type === filter));

  const badgeClass = (t: AdminEvent['event_type']) =>
    t === 'login'
      ? 'bg-green-100 text-green-800 border-green-200'
      : t === 'logout'
      ? 'bg-red-100 text-red-800 border-red-200'
      : t === 'soft_logout'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';

  return (
    <div className="p-6">
      <Card className="border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Admin Activity</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 bg-white text-gray-800 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            >
              <option value="all">All events</option>
              <option value="login">Login</option>
              <option value="soft_logout">Soft logout</option>
              <option value="logout">Logout</option>
              <option value="unlock">Unlock</option>
            </select>
            <Button size="sm" onClick={load} disabled={loading} className="bg-gray-900 text-white hover:bg-gray-800">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          {loading ? (
            <div className="text-sm text-gray-600">Loading activity...</div>
          ) : visibleEvents.length === 0 ? (
            <div className="text-sm text-gray-600">No activity yet.</div>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-md border ${badgeClass(ev.event_type)}`}>{ev.event_type.replace('_', ' ')}</span>
                    <div className="">
                      {ev.reason && <div className="text-sm text-gray-900">{ev.reason}</div>}
                      <div className="text-xs text-gray-600">{ev.user_email || ev.user_id}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamMembersContent() {
  const { users, loading, error } = useAllUsers();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [pendingCollectors, setPendingCollectors] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Load pending collectors
  useEffect(() => {
    loadPendingCollectors();
  }, []);
  
  const loadPendingCollectors = async () => {
    setLoadingPending(true);
    try {
      // Use direct query to avoid RLS permission issues with views
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending_approval')
        .eq('role', 'collector')
        .order('created_at', { ascending: true });
      
      if (!error) {
        setPendingCollectors(data || []);
        console.log('✅ Loaded pending collectors:', data?.length || 0);
      } else {
        console.error('Error loading pending collectors:', error);
        setPendingCollectors([]);
      }
    } catch (err) {
      console.error('Error loading pending collectors:', err);
      setPendingCollectors([]);
    } finally {
      setLoadingPending(false);
    }
  };
  
  const approveCollector = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'active', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (!error) {
        await loadPendingCollectors();
        // Refresh main users list
        window.location.reload();
      }
    } catch (err) {
      console.error('Error approving collector:', err);
    }
  };
  
  const rejectCollector = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (!error) {
        await loadPendingCollectors();
      }
    } catch (err) {
      console.error('Error rejecting collector:', err);
    }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'suspended', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (!error) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error suspending user:', err);
    }
  };

  const activateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'active', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (!error) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error activating user:', err);
    }
  };

  const editUser = (user: any) => {
    setEditingUser(user);
    setShowEditModal(true);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Team Members List</h1>
            <p className="text-gray-600">Manage your team members and their status</p>
          </div>
          <Button 
            onClick={() => setShowAddUserModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add New User
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading team members...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Team Members</h3>
              <p className="text-red-600">{error.message}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Collector Approvals */}
            {pendingCollectors.length > 0 && (
              <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-amber-50">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl">
                    <UserCheck className="w-6 h-6 mr-3" />
                    Pending Collector Approvals ({pendingCollectors.length})
                  </CardTitle>
                  <CardDescription className="text-orange-100">
                    Review and approve new collector signups
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {pendingCollectors.map((collector) => (
                      <div key={collector.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center shadow-sm">
                            <span className="text-lg font-bold text-orange-700">
                              {collector.full_name?.charAt(0) || collector.email?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{collector.full_name || 'No name'}</p>
                            <p className="text-gray-600">{collector.email}</p>
                            <p className="text-sm text-orange-600 font-medium">Employee #: {collector.employee_number || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            onClick={() => approveCollector(collector.id)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectCollector(collector.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Team Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Team Members</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {users.filter(u => u.role?.name === 'admin' || u.role?.name === 'collector').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Admins</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {users.filter(u => u.role?.name === 'admin').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Collectors</h3>
                    <p className="text-3xl font-bold text-orange-600">
                      {users.filter(u => u.role?.name === 'collector').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Team Members Table */}
            <Card className="border-0 shadow-xl">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 rounded-t-lg">
                <h3 className="text-xl font-semibold text-white">Team Members List</h3>
                <p className="text-gray-300">Manage your team members and their status</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter(u => u.role?.name === 'admin' || u.role?.name === 'collector')
                      .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              {/* 3D green avatar badge */}
                              <div className="h-10 w-10 rounded-full bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(0,128,0,0.35)]">
                                <span className="text-sm font-bold text-white drop-shadow">
                                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-0">
                              <div className="text-sm font-semibold text-gray-900">
                                {user.full_name || 'No name'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Employee #{(user as any).employee_number || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* 3D role badge */}
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(0,0,0,0.12)] ${
                            user.role?.name === 'admin'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                          }`}>
                            {user.role?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* 3D status badge */}
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(0,0,0,0.12)] ${
                            user.status === 'active'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : user.status === 'suspended'
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              : (user as any).status === 'pending_approval'
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900'
                              : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900'
                          }`}>
                            {user.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <div className="rounded-lg p-[2px] bg-gradient-to-b from-blue-500 to-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(0,0,128,0.25)]">
                              <button 
                                onClick={() => editUser(user)}
                                className="px-3 py-1 rounded-md bg-transparent text-white hover:bg-white/10 transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                            {(user as any).status === 'pending_approval' && ((user as any).role?.name === 'collector' || (user as any).role === 'collector') && (
                              <>
                                <button
                                  onClick={() => approveCollector(user.id)}
                                  className="text-green-600 hover:text-green-900 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => rejectCollector(user.id)}
                                  className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {user.status === 'active' ? (
                              <div className="rounded-lg p-[2px] bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(128,96,0,0.25)]">
                                <button 
                                  onClick={() => suspendUser(user.id)}
                                  className="px-3 py-1 rounded-md bg-transparent text-gray-900 hover:bg-white/10 transition-colors"
                                >
                                  Suspend
                                </button>
                              </div>
                            ) : user.status === 'suspended' ? (
                              <div className="rounded-lg p-[2px] bg-gradient-to-b from-green-500 to-green-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(0,128,0,0.25)]">
                                <button 
                                  onClick={() => activateUser(user.id)}
                                  className="px-3 py-1 rounded-md bg-transparent text-white hover:bg-white/10 transition-colors"
                                >
                                  Activate
                                </button>
                              </div>
                            ) : null}
                            <div className="rounded-lg p-[2px] bg-gradient-to-b from-red-500 to-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(128,0,0,0.25)]">
                              <button 
                                onClick={() => {
                                  if (confirm('Are you sure you want to remove this user?')) {
                                    // Add remove functionality here
                                  }
                                }}
                                className="px-3 py-1 rounded-md bg-transparent text-white hover:bg-white/10 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        
        {/* Add User Modal */}
        {showAddUserModal && (
          <AddUserModal
            isOpen={showAddUserModal}
            onClose={() => setShowAddUserModal(false)}
            onSuccess={() => {
              setShowAddUserModal(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

function UsersContent() {
  const { users, loading, error } = useAllUsers();
  const { townships, loading: townshipsLoading, error: townshipsError } = useTownships();
  
  // Function to extract township from address
  const extractTownshipFromAddress = (address: string | null | undefined): string => {
    if (!address) return 'Not specified';
    
    // Common township patterns in South Africa
    const townshipPatterns = [
      /(?:township|town|area|suburb|location|settlement|village|informal settlement)/i,
      /(?:soweto|alexandra|khayelitsha|gugulethu|langa|nyanga|philippi|mitchells plain|manenberg|bontheuwel|delft|belhar|kuils river|strand|gordon's bay|somerset west|paarl|stellenbosch|franschhoek|wellington|malmesbury|vredenburg|saldanha|vredendal|springbok|upington|kimberley|bloemfontein|welkom|bethlehem|harrismith|ladysmith|newcastle|pietermaritzburg|durban|richards bay|port shepstone|margate|umtata|east london|port elizabeth|grahamstown|graaff-reinet|oudtshoorn|george|knysna|plettenberg bay|mossel bay|swellendam|wolseley|tulbagh|ceres|wellington|paarl|stellenbosch|franschhoek|somerset west|strand|gordon's bay|kuils river|belhar|delft|mitchells plain|manenberg|bontheuwel|philippi|nyanga|langa|gugulethu|khayelitsha|alexandra|soweto)/i
    ];
    
    // Try to find township patterns
    for (const pattern of townshipPatterns) {
      const match = address.match(pattern);
      if (match) {
        return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
      }
    }
    
    // If no pattern matches, try to extract the last part of the address
    const parts = address.split(',').map(part => part.trim());
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.length > 2 && lastPart.length < 50) {
        return lastPart;
      }
    }
    
    return 'Not specified';
  };
  
  // Calculate user statistics
  const totalUsers = users.length;
  const residents = users.filter(u => u.role?.name === 'resident').length;
  const collectors = users.filter(u => u.role?.name === 'collector').length;
  const admins = users.filter(u => u.role?.name === 'admin' || u.role?.name === 'super_admin').length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Users Management</h1>
            <p className="text-gray-600">Manage system users and their locations</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              <Users className="w-4 h-4 mr-2" />
              {totalUsers} Total Users
            </Badge>
            <Badge className="text-sm bg-gradient-to-r from-green-600 to-green-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              <Activity className="w-4 h-4 mr-2" />
              {activeUsers} Active
            </Badge>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Error loading users: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-900">Total Users</CardTitle>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {totalUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    System users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-green-900">Residents</CardTitle>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {residents.toLocaleString()}
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    Community members
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-orange-900">Collectors</CardTitle>
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {collectors.toLocaleString()}
                  </div>
                  <p className="text-sm text-orange-700 font-medium">
                    Collection staff
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-purple-900">Admins</CardTitle>
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {admins.toLocaleString()}
                  </div>
                  <p className="text-sm text-purple-700 font-medium">
                    System administrators
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-emerald-900">Active</CardTitle>
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {activeUsers.toLocaleString()}
                  </div>
                  <p className="text-sm text-emerald-700 font-medium">
                    Active users
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Users Table */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">All Users</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Complete list of system users with location information</p>
                  </div>
                  <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
                    <Users className="w-4 h-4 mr-2" />
                    {totalUsers} Users
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Township</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => {
                        const township = extractTownshipFromAddress((user as any).address || (user as any).township_name);
                        return (
                          <tr key={user.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-lg font-semibold text-white">
                                      {(user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'U').charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {user.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                                user.role?.name === 'admin' || user.role?.name === 'super_admin' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                                user.role?.name === 'collector' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                                user.role?.name === 'resident' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                              }`}>
                                {user.role?.name || 'Unknown'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">
                                  {township}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                                user.status === 'active' 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                  : user.status === 'suspended'
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              }`}>
                                {user.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin' || profile?.role === 'super_admin' || profile?.role === 'SUPER_ADMIN';

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

      // Normalize photo URLs and provide storage fallback if table has no entries
      const resolvedPhotos: any[] = [];
      const photoRows = Array.isArray(photos) ? photos : [];

      // 1) Normalize any stored paths to public URLs
      for (const ph of photoRows) {
        const raw = String(ph?.photo_url || '');
        if (raw.startsWith('http')) {
          resolvedPhotos.push(ph);
        } else if (raw) {
          try {
            const { data: pub } = supabase.storage
              .from('collection-photos')
              .getPublicUrl(raw);
            resolvedPhotos.push({ ...ph, photo_url: pub.publicUrl });
          } catch {
            resolvedPhotos.push(ph);
          }
        }
      }

      // 2) Fallback: if nothing in table, try listing storage by prefix `${collectionId}/`
      if (resolvedPhotos.length === 0) {
        try {
          const { data: files, error: listErr } = await supabase.storage
            .from('collection-photos')
            .list(`${collectionId}`, { limit: 100 });
          if (!listErr && Array.isArray(files)) {
            for (const f of files) {
              const path = `${collectionId}/${f.name}`;
              const { data: pub } = supabase.storage
                .from('collection-photos')
                .getPublicUrl(path);
              resolvedPhotos.push({ id: path, collection_id: collectionId, photo_url: pub.publicUrl, photo_type: 'general' });
            }
          }
        } catch {}
      }

      setDetails({ base: base.data, items: items || [], photos: resolvedPhotos });
    } catch (e) {
      setNotice({ type: 'error', message: 'Failed to load collection details.' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Move this collection to deleted transactions? This will hide it from Main App and Office views, but it can be restored later.') : true;
    if (!confirmed) return;
    
    console.log('🗑️ Starting soft delete for collection:', collectionId);
    
    try {
      // Optimistic remove
      const prevRows = rows;
      setRows(prev => prev.filter(c => c.id !== collectionId));
      
      console.log('🔄 Calling softDeleteCollection...');
      const result = await softDeleteCollection(collectionId, 'Deleted by super admin from Collections page');
      
      if (result.success) {
        console.log('✅ Collection soft deleted successfully');
        setNotice({ type: 'success', message: 'Collection moved to deleted transactions successfully.' });
        try { 
          clearPickupsCache(); 
          console.log('✅ Pickups cache cleared');
        } catch (cacheError) {
          console.warn('⚠️ Failed to clear pickups cache:', cacheError);
        }
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('❌ softDeleteCollection failed:', result.message);
        setRows(prevRows);
        setNotice({ type: 'error', message: `Failed to delete collection: ${result.message}` });
      }
    } catch (e) {
      console.error('❌ Exception in handleDelete:', e);
      setNotice({ type: 'error', message: `Failed to delete collection: ${e instanceof Error ? e.message : 'Unknown error'}` });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Collections Management</h1>
            <p className="text-gray-600 text-sm">Manage and track material collections from residents</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Collections</div>
              <div className="text-xl font-bold text-blue-600">{rows.length}</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Error loading collections: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notice && (
              <div className={`px-4 py-3 rounded-lg border ${notice.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{notice.message}</span>
                  <button className="text-xs underline hover:no-underline" onClick={() => setNotice(null)}>Dismiss</button>
                </div>
              </div>
            )}
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-900">Total Collections</CardTitle>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {rows.length.toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    All time collections
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-yellow-900">Pending</CardTitle>
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {rows.filter(c => c.status === 'pending' || c.status === 'submitted').length.toLocaleString()}
                  </div>
                  <p className="text-sm text-yellow-700 font-medium">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-green-900">Approved</CardTitle>
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {rows.filter(c => c.status === 'approved').length.toLocaleString()}
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    Successfully processed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-red-900">Rejected</CardTitle>
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {rows.filter(c => c.status === 'rejected').length.toLocaleString()}
                  </div>
                  <p className="text-sm text-red-700 font-medium">
                    Declined requests
                  </p>
                </CardContent>
              </Card>
            </div>
          
            {/* Collections Table */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      All Collections ({rows.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Complete list of material collections from residents</p>
                  </div>
                  <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
                    <Package className="w-4 h-4 mr-2" />
                    {rows.length} Collections
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (R/kg)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (R)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.map((collection) => (
                        <tr key={collection.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
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
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                  <Users className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {fullNameByEmail[collection.customer?.email || ''] || getDisplayName(collection.customer?.full_name, collection.customer?.email) || 'Unknown Resident'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {collection.customer?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                  <Package className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {fullNameByEmail[collection.collector?.email || ''] || getDisplayName(collection.collector?.full_name, collection.collector?.email) || 'Unassigned'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {collection.collector?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg mr-3">
                                <Package className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {collection.material_type || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mr-3">
                                <TrendingUp className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {collection.weight_kg || 0} kg
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              R{collection.material_rate_per_kg?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">
                              R{collection.computed_value?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                              collection.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                              collection.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
                              'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                            }`}>
                              {collection.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(collection.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {(collection.status === 'pending' || collection.status === 'submitted') && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    onClick={() => handleUpdate(collection.id, 'approved')}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleUpdate(collection.id, 'rejected')}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => openDetails(collection.id)}
                              >
                                <Activity className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {collection.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => handleResetTransactions(collection)}
                                  title="Reset transactions for this collection"
                                >
                                  <Settings className="w-4 h-4 mr-1" />
                                  Reset
                                </Button>
                              )}
                              {isSuperAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(collection.id)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">System Configuration</h1>
            <p className="text-gray-600">Manage system settings and configurations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">System Status</p>
                  <p className="text-2xl font-bold">Online</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Database</p>
                  <p className="text-2xl font-bold">Connected</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">API Status</p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          <NotificationSettings />
          
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Additional Configuration</h3>
                  <p className="text-gray-100 text-sm">System settings and preferences</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                Additional system configuration options will be implemented here
              </div>
            </CardContent>
          </Card>
        </div>
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
  const [softOpen, setSoftOpen] = useState(false);
  const [softReason, setSoftReason] = useState('Tea Break');
  const { notifications, removeNotification } = useNotifications();
  const { lock, touch, setup, needsSetup, isLocked } = usePwaLock();

  useEffect(() => {
    setIsClient(true);
    console.log('AdminDashboardClient: isClient set to true');
  }, []);

  // Check if user needs to set up session lock credentials
  useEffect(() => {
    if (!user || !isClient) return;
    
    // Check if user has session lock credentials set up
    if (needsSetup) {
      console.log('AdminDashboardClient: User needs session lock setup');
      // Force the lock state to show the setup modal
      lock();
    }
  }, [user, isClient, needsSetup, lock]);



  // Check authentication and admin/super_admin role
  useEffect(() => {
    if (!isClient || authLoading) return;
    const email = user?.email?.toLowerCase?.() || '';
    const role = profile?.role?.toLowerCase?.();
    const isPrivileged = isAdminUser(user, profile);
    if (!user || !isPrivileged) {
      console.log('AdminDashboardClient: User not authenticated or not privileged, redirecting to login');
      router.push('/admin-login');
    }
  }, [isClient, user, profile, authLoading, router]);

  const handleLogout = async () => {
    try {
      console.log('🚪 AdminDashboardClient: Starting logout process...');
      await logout();
      console.log('✅ AdminDashboardClient: Logout successful, redirecting to admin-login');
      router.push('/admin-login');
    } catch (error) {
      console.error('❌ AdminDashboardClient: Logout error:', error);
      // Still redirect even if logout fails
      router.push('/admin-login');
    }
  };

  // Use the existing PWA lock system
  const handleSessionLock = () => {
    lock();
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
  const isPrivileged = isAdminUser(user, profile);
  if (!user || !isPrivileged) {
    console.log('AdminDashboardClient: Access denied, redirecting to login');
    return null;
  }

  // Check if user is super admin
  const isSuperAdmin = user?.email?.toLowerCase() === 'superadmin@wozamali.co.za';

  console.log('AdminDashboardClient: Rendering dashboard for admin user:', profile?.email || user?.email);
  console.log('AdminDashboardClient: Is super admin:', isSuperAdmin);

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent onPageChange={setCurrentPage} onAddUser={() => setShowAddUserModal(true)} isSuperAdmin={isSuperAdmin} softOpen={softOpen} setSoftOpen={setSoftOpen} softReason={softReason} setSoftReason={setSoftReason} />;
      case 'users':
        return <UsersContent />;
      case 'admin-activity':
        return <AdminActivityContent />;
      case 'settings':
        return <AdminSettingsPage />;
      case 'team-members':
        return <TeamMembersPage />;
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
      case 'transactions':
        return <TransactionsPage />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'config':
        return <ConfigContent />;
      default:
        return <DashboardContent onPageChange={setCurrentPage} onAddUser={() => setShowAddUserModal(true)} isSuperAdmin={isSuperAdmin} softOpen={softOpen} setSoftOpen={setSoftOpen} softReason={softReason} setSoftReason={setSoftReason} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <AdminSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'Admin'}!
                </h3>
                <p className="text-sm text-gray-600">Manage your system efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <Button
                  onClick={() => setCurrentPage('admin-activity')}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 border-0 shadow-md"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Admin Activity
                </Button>
              )}
              {isPrivileged && (
                <Button
                  onClick={() => setSoftOpen(true)}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 border-0 shadow-md"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Lock Session
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Page Content - Only show if session lock is set up */}
        {!needsSetup && (
          <div className="bg-gray-50 min-h-screen">
            {renderPageContent()}
          </div>
        )}
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


      {/* PWA Lock System - Setup or Unlock */}
      {(isLocked || needsSetup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {needsSetup ? 'Setup Session Lock' : 'Session Locked'}
              </h2>
              <p className="text-sm text-gray-600">
                {needsSetup 
                  ? 'Set up your username and PIN to secure your session' 
                  : 'Enter your credentials to unlock'
                }
              </p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const username = formData.get('username') as string;
              const pin = formData.get('pin') as string;
              const result = await setup(username, pin);
              if (result.success) {
                touch();
              } else {
                alert(result.error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN (5 digits)</label>
                  <input
                    name="pin"
                    type="password"
                    required
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 5-digit PIN"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  {needsSetup ? 'Setup Session Lock' : 'Unlock Session'}
                </button>
              </div>
            </form>
            {needsSetup && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Required:</strong> You must set up session lock credentials before using the system.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toasts */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          type={(notification.type === 'system' || notification.type === 'error') ? 'collection' : notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
