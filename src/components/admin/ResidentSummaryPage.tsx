"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Scale,
  TrendingUp,
  Calendar,
  User,
  Truck,
  Banknote
} from 'lucide-react';
import { getPickups, subscribeToPickups, updatePickupStatus, formatDate, formatCurrency, formatWeight, TransformedPickup } from '@/lib/admin-services';
import { supabase } from '../../lib/supabase';

function getDisplayName(fullName?: string, email?: string): string {
  const cleanedFullName = (fullName || '').trim();
  if (cleanedFullName) return cleanedFullName;
  const e = (email || '').trim();
  if (!e) return 'Unknown';
  const local = e.split('@')[0];
  const parts = local.replace(/\.+|_+|-+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return e;
  const cased = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  return cased || e;
}

export default function ResidentSummaryPage() {
  const [pickups, setPickups] = useState<TransformedPickup[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<TransformedPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPickup, setSelectedPickup] = useState<TransformedPickup | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [fullNameByEmail, setFullNameByEmail] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPickups();
    const watchdog = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    const subscription = subscribeToPickups((payload) => {
      if (payload.eventType === 'INSERT') {
        setPickups(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setPickups(prev => prev.map(pickup => pickup.id === payload.new.id ? payload.new : pickup));
      } else if (payload.eventType === 'DELETE') {
        setPickups(prev => prev.filter(pickup => pickup.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []);

  useEffect(() => {
    let filtered = pickups;
    if (searchTerm) {
      filtered = filtered.filter(pickup =>
        pickup.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.collector?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.address?.line1?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === statusFilter);
    }
    setFilteredPickups(filtered);
  }, [pickups, searchTerm, statusFilter]);

  // Backfill full names by email from users/profiles if missing
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const emails = Array.from(new Set(
          filteredPickups
            .map(p => p.customer?.email?.trim())
            .filter(e => !!e && !((p: any) => p)(null)) as string[]
        ));
        const missing = emails.filter(e => !(fullNameByEmail[e]));
        if (missing.length === 0) return;

        // Query users table
        const { data: usersData } = await supabase
          .from('users')
          .select('email, full_name, first_name, last_name')
          .in('email', missing);
        const map: Record<string, string> = { ...fullNameByEmail };
        (usersData || []).forEach((u: any) => {
          const v = (u.full_name && String(u.full_name).trim())
            || `${(u.first_name||'').toString().trim()} ${(u.last_name||'').toString().trim()}`.trim();
          if (u.email && v) map[String(u.email)] = v;
        });

        // Fallback to legacy profiles if still missing
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
  }, [filteredPickups, fullNameByEmail]);

  const customerSummaries = useMemo(() => {
    const map = new Map<string, {
      customerId?: string;
      name: string;
      email: string;
      count: number;
      totalKg: number;
      totalValue: number;
      lastDate: string;
    }>();

    for (const p of filteredPickups) {
      const key = (p as any).user_id || p.customer?.email || 'unknown';
      const name = getDisplayName(p.customer?.full_name, p.customer?.email);
      const email = p.customer?.email || '';
      const existing = map.get(key) || { customerId: (p as any).user_id, name, email, count: 0, totalKg: 0, totalValue: 0, lastDate: '' };
      existing.count += 1;
      existing.totalKg += p.total_kg || 0;
      existing.totalValue += p.total_value || 0;
      const createdAt = (p as any).created_at as string;
      if (createdAt && (!existing.lastDate || new Date(createdAt).getTime() > new Date(existing.lastDate).getTime())) {
        existing.lastDate = createdAt;
      }
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredPickups]);

  const loadPickups = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getPickups();
      setPickups(data);
    } catch (error) {
      setLoadError((error as any)?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId: string, newStatus: string) => {
    try {
      const result = await updatePickupStatus(pickupId, newStatus, approvalNote);
      if (result) {
        setPickups(prevPickups => prevPickups.map(pickup => pickup.id === pickupId ? { ...pickup, status: newStatus, admin_notes: approvalNote } : pickup));
        setSelectedPickup(null);
        setApprovalNote('');
      }
    } catch (error) {
      // ignore
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
      case 'submitted':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Resident Summary</CardTitle>
            <CardDescription>We couldn't load data right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 mb-3">{loadError}</div>
            <Button onClick={loadPickups} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Resident Summary</h1>
          <p className="text-white mt-2">Manage and track resident-related collections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Records</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pickups.length}</div>
            <p className="text-xs text-white">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pickups.filter(p => p.status === 'submitted').length}</div>
            <p className="text-xs text-white">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Weight</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatWeight(pickups.reduce((sum, p) => sum + (p.total_kg || 0), 0))}</div>
            <p className="text-xs text-white">Recycled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(pickups.reduce((sum, p) => sum + (p.total_value || 0), 0))}</div>
            <p className="text-xs text-white">Generated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search residents or addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            Resident Summary ({customerSummaries.length})
          </CardTitle>
          <CardDescription className="text-white">Aggregated totals per resident based on current filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-white">Resident</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Collections</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Total Weight</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Total Value</th>
                  <th className="text-left py-3 px-4 font-medium text-white">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {customerSummaries.map((row) => (
                  <tr key={(row.customerId || row.email || Math.random().toString())} className="group border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-white" />
                        <div className="font-medium text-white">{fullNameByEmail[row.email] || row.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{row.email || '-'}</td>
                    <td className="py-3 px-4 text-white">{row.count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-white" />
                        <span className="font-medium text-white">{formatWeight(row.totalKg || 0)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-white" />
                        <span className="font-medium text-white">{formatCurrency(row.totalValue || 0)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white" />
                        {row.lastDate ? formatDate(row.lastDate) : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
                {customerSummaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">No residents match your filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pickups table and modal removed as requested */}
    </div>
  );
}


