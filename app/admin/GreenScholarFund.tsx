'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TreePine, 
  School, 
  Home, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Plus,
  Edit,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GreenScholarFundData {
  totalBalance: number;
  petDonations: number;
  directDonations: number;
  expenses: number;
  recentTransactions: GreenScholarTransaction[];
  schools: School[];
  childHomes: ChildHome[];
  monthlyStats: MonthlyStats[];
}

interface GreenScholarTransaction {
  id: string;
  transaction_type: string;
  source_type: string;
  amount: number;
  description: string;
  donor_name: string;
  donor_email: string;
  beneficiary_type: string;
  beneficiary_name: string;
  status: string;
  created_at: string;
}

interface School {
  id: string;
  name: string;
  school_code: string;
  city: string;
  province: string;
  student_count: number;
  school_type: string;
  is_active: boolean;
}

interface ChildHome {
  id: string;
  name: string;
  home_code: string;
  city: string;
  province: string;
  children_count: number;
  age_range: string;
  is_active: boolean;
}

interface MonthlyStats {
  month: string;
  pet_donations: number;
  direct_donations: number;
  expenses: number;
  net_balance: number;
}

export default function GreenScholarFund() {
  const [data, setData] = useState<GreenScholarFundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [petStats, setPetStats] = useState<{
    totalPetCollections: number;
    approvedPetCollections: number;
    pendingPetCollections: number;
    uniqueResidents: number;
    uniqueCollectors: number;
  }>({
    totalPetCollections: 0,
    approvedPetCollections: 0,
    pendingPetCollections: 0,
    uniqueResidents: 0,
    uniqueCollectors: 0
  });

  useEffect(() => {
    loadGreenScholarData();
  }, []);

  const loadGreenScholarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load fund balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('green_scholar_fund_balance')
        .select('*')
        .single();

      if (balanceError) throw balanceError;

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('green_scholar_transactions')
        .select(`
          *,
          schools(name),
          child_headed_homes(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;

      // Load schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (schoolsError) throw schoolsError;

      // Load child-headed homes
      const { data: childHomesData, error: childHomesError } = await supabase
        .from('child_headed_homes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (childHomesError) throw childHomesError;

      // Load monthly stats from summary view
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('green_scholar_fund_summary')
        .select('*')
        .order('month', { ascending: false })
        .limit(12);

      // Compute quick PET stats for cards
      const allCollections = await supabase
        .from('collections')
        .select('id, status, contributes_to_green_scholar_fund, resident_id, collector_id')
        .eq('contributes_to_green_scholar_fund', true);

      if (!allCollections.error) {
        const rows = allCollections.data || [];
        const totalPetCollections = rows.length;
        const approvedPetCollections = rows.filter((r: any) => String(r.status) === 'approved').length;
        const pendingPetCollections = rows.filter((r: any) => String(r.status) === 'pending').length;
        const uniqueResidents = new Set((rows as any[]).map(r => r.resident_id)).size;
        const uniqueCollectors = new Set((rows as any[]).map(r => r.collector_id)).size;
        setPetStats({ totalPetCollections, approvedPetCollections, pendingPetCollections, uniqueResidents, uniqueCollectors });
      }

      // Transform transactions data
      const transformedTransactions = transactionsData?.map(transaction => ({
        ...transaction,
        beneficiary_name: transaction.beneficiary_type === 'school' 
          ? transaction.schools?.name 
          : transaction.beneficiary_type === 'child_home'
          ? transaction.child_headed_homes?.name
          : 'General Fund'
      })) || [];

      setData({
        totalBalance: balanceData?.total_balance || 0,
        petDonations: balanceData?.pet_donations_total || 0,
        directDonations: balanceData?.direct_donations_total || 0,
        expenses: balanceData?.expenses_total || 0,
        recentTransactions: transformedTransactions,
        schools: schoolsData || [],
        childHomes: childHomesData || [],
        monthlyStats: monthlyData || []
      });

    } catch (err) {
      console.error('Error loading Green Scholar data:', err);
      setError('Failed to load Green Scholar Fund data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getTransactionIcon = (type: string, sourceType?: string) => {
    if (type === 'contribution' && sourceType === 'pet_bottles_collection') {
      return <TreePine className="h-4 w-4 text-green-600" />;
    }
    switch (type) {
      case 'pet_contribution':
        return <TreePine className="h-4 w-4 text-green-600" />;
      case 'donation':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'distribution':
      case 'expense':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status || 'confirmed';
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button onClick={loadGreenScholarData} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TreePine className="h-8 w-8 text-green-600" />
            Green Scholar Fund
          </h1>
          <p className="text-gray-600 mt-1">
            Managing educational funding from PET donations and direct contributions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadGreenScholarData}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Fund Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fund Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for educational support
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PET Donations</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From recycled PET materials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Donations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(data?.directDonations || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From user contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data?.expenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Funds distributed to beneficiaries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional PET and Beneficiary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools Supported</CardTitle>
            <School className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data?.schools.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active partner schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Child Homes Supported</CardTitle>
            <Home className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.childHomes.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active child-headed homes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved PET Collections</CardTitle>
            <TreePine className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {petStats.approvedPetCollections}
            </div>
            <p className="text-xs text-muted-foreground">Contributing to the fund</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending PET Collections</CardTitle>
            <TreePine className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {petStats.pendingPetCollections}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="homes">Child Homes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions: show PET and Direct Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.recentTransactions
                    .filter(t =>
                      t.transaction_type === 'donation' ||
                      t.transaction_type === 'pet_contribution' ||
                      (t.transaction_type === 'contribution' && t.source_type === 'pet_bottles_collection')
                    )
                    .slice(0, 8)
                    .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type, transaction.source_type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.beneficiary_name && (
                            <p className="text-sm text-gray-500">{transaction.beneficiary_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.transaction_type === 'distribution' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Beneficiaries Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Beneficiaries Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <School className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Active Schools</p>
                        <p className="text-sm text-gray-500">
                          {data?.schools.length || 0} schools registered
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {data?.schools.reduce((sum, school) => sum + school.student_count, 0) || 0}
                      </p>
                      <p className="text-xs text-gray-500">total students</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Child-Headed Homes</p>
                        <p className="text-sm text-gray-500">
                          {data?.childHomes.length || 0} homes registered
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {data?.childHomes.reduce((sum, home) => sum + home.children_count, 0) || 0}
                      </p>
                      <p className="text-xs text-gray-500">total children</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.donor_name} • {transaction.beneficiary_name} • 
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools" className="space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle>Registered Schools</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.schools.map((school) => (
              <Card key={school.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{school.name}</CardTitle>
                    <Badge variant="outline">{school.school_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{school.city}, {school.province}</p>
                    <p className="text-sm text-gray-600">{school.student_count} students</p>
                    <p className="text-sm text-gray-600">Code: {school.school_code}</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Child Homes Tab */}
        <TabsContent value="homes" className="space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle>Child-Headed Homes</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Home
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.childHomes.map((home) => (
              <Card key={home.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{home.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{home.city}, {home.province}</p>
                    <p className="text-sm text-gray-600">{home.children_count} children</p>
                    <p className="text-sm text-gray-600">Ages: {home.age_range}</p>
                    <p className="text-sm text-gray-600">Code: {home.home_code}</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
