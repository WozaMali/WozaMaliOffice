'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TreePine, 
  DollarSign, 
  TrendingUp, 
  Users,
  Heart,
  School,
  Home
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GreenScholarFundData {
  totalBalance: number;
  petDonations: number;
  directDonations: number;
  expenses: number;
  recentTransactions: any[];
  schools: any[];
  childHomes: any[];
}

export default function GreenScholarFundDisplay() {
  const [fundData, setFundData] = useState<GreenScholarFundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFundData();
  }, []);

  const loadFundData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load fund balance (allow 0 rows without error)
      const { data: balanceData, error: balanceError } = await supabase
        .from('green_scholar_fund_balance')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

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
        .limit(5);

      if (transactionsError) throw transactionsError;

      // Load schools count
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id')
        .eq('is_active', true);

      if (schoolsError) throw schoolsError;

      // Load child homes count
      const { data: childHomesData, error: childHomesError } = await supabase
        .from('child_headed_homes')
        .select('id')
        .eq('is_active', true);

      if (childHomesError) throw childHomesError;

      // Transform transactions data
      const transformedTransactions = transactionsData?.map(transaction => ({
        ...transaction,
        beneficiary_name: transaction.beneficiary_type === 'school' 
          ? transaction.schools?.name 
          : transaction.beneficiary_type === 'child_home'
          ? transaction.child_headed_homes?.name
          : 'General Fund'
      })) || [];

      setFundData({
        totalBalance: balanceData?.total_balance || 0,
        petDonations: balanceData?.pet_donations_total || 0,
        directDonations: balanceData?.direct_donations_total || 0,
        expenses: balanceData?.expenses_total || 0,
        recentTransactions: transformedTransactions,
        schools: schoolsData || [],
        childHomes: childHomesData || []
      });

    } catch (err) {
      console.error('Error loading Green Scholar Fund data:', err);
      setError('Failed to load fund data');
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
      case 'pet_donation':
        return <TreePine className="h-4 w-4 text-green-600" />;
      case 'direct_donation':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'expense':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={loadFundData} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fund Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fund</CardTitle>
            <TreePine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(fundData?.totalBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for education
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PET Donations</CardTitle>
            <TreePine className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(fundData?.petDonations || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From recycled materials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Donations</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(fundData?.directDonations || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From generous donors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundData?.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No recent activity</p>
              <p className="text-sm">Fund activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fundData?.recentTransactions
                .filter(t => 
                  t.transaction_type === 'direct_donation' ||
                  t.transaction_type === 'pet_donation' ||
                  (t.transaction_type === 'contribution' && t.source_type === 'pet_bottles_collection')
                )
                .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type, transaction.source_type)}
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.donor_name} • {transaction.beneficiary_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {transaction.transaction_type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Our Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <School className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {fundData?.schools.length || 0}
                </p>
                <p className="text-sm text-gray-600">Schools Supported</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Home className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {fundData?.childHomes.length || 0}
                </p>
                <p className="text-sm text-gray-600">Child Homes Supported</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Support Education Through Recycling</h3>
          <p className="mb-4 opacity-90">
            Every PET bottle you recycle contributes to educational funding. 
            Make a direct donation to support specific schools or child-headed homes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
              <TreePine className="h-4 w-4 mr-2" />
              Start Recycling
            </Button>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600">
              <Heart className="h-4 w-4 mr-2" />
              Make Donation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
