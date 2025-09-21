'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Star,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getAllRewards, 
  createReward, 
  updateReward, 
  deleteReward, 
  toggleRewardStatus,
  Reward,
  CreateRewardData,
  uploadRewardLogo 
} from '@/lib/rewardsService';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_required: number;
  category: string;
  is_active: boolean;
  logo_url?: string;
  redeem_url?: string;
  order_url?: string;
  created_at: string;
  updated_at: string;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    name: string;
    description: string;
    points_required: string;
    category: 'cash' | 'service' | 'product' | 'voucher';
    is_active: boolean;
    redeem_url?: string;
    order_url?: string;
  }>({ name: '', description: '', points_required: '', category: 'cash', is_active: true });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    points_required: string;
    category: 'cash' | 'service' | 'product' | 'voucher';
    is_active: boolean;
    redeem_url?: string;
    order_url?: string;
  }>({ name: '', description: '', points_required: '', category: 'cash', is_active: true });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load rewards from database
  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllRewards();
      if (error) {
        console.error('Error loading rewards:', error);
        setRewards([]);
        setFilteredRewards([]);
      } else {
        setRewards(data || []);
        setFilteredRewards(data || []);
      }
    } catch (error) {
      console.error('Exception loading rewards:', error);
      setRewards([]);
      setFilteredRewards([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter rewards based on search and filters
  useEffect(() => {
    let filtered = rewards;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reward =>
        reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(reward => reward.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reward => 
        statusFilter === 'active' ? reward.is_active : !reward.is_active
      );
    }

    setFilteredRewards(filtered);
  }, [rewards, searchTerm, categoryFilter, statusFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cash':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'service':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'product':
        return <Gift className="w-4 h-4 text-yellow-600" />;
      default:
        return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (category) {
      case 'cash':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'service':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'product':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const openEditModal = (reward: RewardItem) => {
    setEditingId(reward.id);
    setEditForm({
      name: reward.name,
      description: reward.description || '',
      points_required: String(reward.points_required ?? ''),
      category: (reward.category as any) || 'cash',
      is_active: !!reward.is_active,
      redeem_url: reward.redeem_url || '',
      order_url: reward.order_url || ''
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleDelete = async (reward: RewardItem) => {
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete reward "${reward.name}"?`) : true;
    if (!ok) return;
    const res = await deleteReward(reward.id);
    if (!res.success) {
      // eslint-disable-next-line no-console
      console.error('Delete reward failed:', res.error);
      return;
    }
    await loadRewards();
  };

  const submitEdit = async () => {
    if (!editingId) return;
    if (!editForm.name || !editForm.points_required) {
      setEditError('Name and points are required.');
      return;
    }
    try {
      setEditSubmitting(true);
      setEditError(null);
      const resp = await fetch(`/api/admin/rewards/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          points_required: Number(editForm.points_required || 0),
          category: editForm.category,
          is_active: !!editForm.is_active,
          redeem_url: editForm.redeem_url || null,
          order_url: editForm.order_url || null,
        }),
      });
      if (!resp.ok) {
        const msg = await resp.json().catch(() => ({} as any));
        throw new Error((msg as any)?.error || `HTTP ${resp.status}`);
      }
      setIsEditOpen(false);
      setEditingId(null);
      await loadRewards();
    } catch (e: any) {
      setEditError(e?.message || 'Failed to update reward.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Rewards Management</h1>
            <p className="text-gray-600">Configure and manage reward options for users</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              <Gift className="w-4 h-4 mr-2" />
              {rewards.length} Total Rewards
            </Badge>
            <Badge className="text-sm bg-gradient-to-r from-green-600 to-green-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              <Target className="w-4 h-4 mr-2" />
              {rewards.filter(r => r.is_active).length} Active
            </Badge>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Reward
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Total Rewards</CardTitle>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {rewards.length.toLocaleString()}
              </div>
              <p className="text-sm text-blue-700 font-medium">
                Available rewards
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-900">Active Rewards</CardTitle>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {rewards.filter(r => r.is_active).length.toLocaleString()}
              </div>
              <p className="text-sm text-green-700 font-medium">
                Currently available
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-yellow-900">Cash Rewards</CardTitle>
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {rewards.filter(r => r.category === 'cash').length.toLocaleString()}
              </div>
              <p className="text-sm text-yellow-700 font-medium">
                Cash vouchers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-900">Service Rewards</CardTitle>
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {rewards.filter(r => r.category === 'service').length.toLocaleString()}
              </div>
              <p className="text-sm text-purple-700 font-medium">
                Service benefits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-xl bg-white mb-6">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cash">Cash Rewards</SelectItem>
                  <SelectItem value="service">Service Rewards</SelectItem>
                  <SelectItem value="product">Product Rewards</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Table */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Rewards ({filteredRewards.length})</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage reward options and their point requirements</p>
              </div>
              <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
                <Gift className="w-4 h-4 mr-2" />
                {filteredRewards.length} Rewards
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Required</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                              {getCategoryIcon(reward.category)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {reward.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                          reward.category === 'cash' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                          reward.category === 'service' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                          reward.category === 'product' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                          'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                        }`}>
                          {reward.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{reward.points_required}</span>
                          <span className="text-sm text-gray-500 ml-1">points</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
                          reward.is_active 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                        }`}>
                          {reward.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {reward.redeem_url ? (
                            <a
                              href={reward.redeem_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                            >
                              Redeem Link
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          {reward.order_url ? (
                            <a
                              href={reward.order_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-700 hover:text-blue-900 underline"
                            >
                              Order Link
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {reward.redeem_url && (
                            <a
                              href={reward.redeem_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              Open Redeem
                            </a>
                          )}
                          {reward.order_url && (
                            <a
                              href={reward.order_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              Open Order
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-50"
                            onClick={() => openEditModal(reward)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={async () => {
                              const ok = typeof window !== 'undefined' ? window.confirm(`Delete reward \"${reward.name}\"?`) : true;
                              if (!ok) return;
                              try {
                                const resp = await fetch(`/api/admin/rewards/${reward.id}`, { method: 'DELETE' });
                                if (!resp.ok) {
                                  const msg = await resp.json().catch(() => ({} as any));
                                  throw new Error((msg as any)?.error || `HTTP ${resp.status}`);
                                }
                                await loadRewards();
                              } catch (e: any) {
                                // eslint-disable-next-line no-console
                                console.error('Delete failed:', e?.message || e);
                                alert(`Failed to delete: ${e?.message || 'Unknown error'}`);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRewards.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Gift className="h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-lg font-medium">No rewards match your filters</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Reward Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 text-gray-900">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Reward</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">x</button>
              </div>
              <div className="p-6 space-y-4">
                {createError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 text-sm">{createError}</div>
                )}
                <div>
                  <Label className="text-sm text-gray-700">Name</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Reward name" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Description</Label>
                  <Input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Reward description" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-700">Points Required</Label>
                    <Input type="number" min={0} value={createForm.points_required} onChange={(e) => setCreateForm({ ...createForm, points_required: e.target.value })} placeholder="e.g. 500" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Category</Label>
                    <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as any })} className="mt-1 w-full rounded-md px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
                      <option value="cash">Cash</option>
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-700">Redeem URL (Main App button)</Label>
                    <Input value={createForm.redeem_url || ''} onChange={(e) => setCreateForm({ ...createForm, redeem_url: e.target.value })} placeholder="https://... (optional)" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Order URL (Main App button)</Label>
                    <Input value={createForm.order_url || ''} onChange={(e) => setCreateForm({ ...createForm, order_url: e.target.value })} placeholder="https://... (optional)" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Company Logo (optional)</Label>
                  <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="mt-1 w-full text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="is_active" type="checkbox" checked={createForm.is_active} onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="is_active" className="text-sm text-gray-700">Active</Label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <Button variant="outline" className="border-gray-300" onClick={() => setIsCreateOpen(false)} disabled={submitting}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting} onClick={async () => {
                  try {
                    setSubmitting(true);
                    setCreateError(null);
                    if (!createForm.name || !createForm.points_required) {
                      setCreateError('Name and points are required.');
                      setSubmitting(false);
                      return;
                    }

                    // Build multipart payload to let the API handle file upload + insert
                    const form = new FormData();
                    form.append('name', createForm.name);
                    form.append('description', createForm.description || '');
                    form.append('points_required', String(Number(createForm.points_required || 0)));
                    form.append('category', createForm.category);
                    form.append('is_active', String(!!createForm.is_active));
                    if (createForm.redeem_url) form.append('redeem_url', createForm.redeem_url);
                    if (createForm.order_url) form.append('order_url', createForm.order_url);
                    if (logoFile) form.append('logo', logoFile, logoFile.name);

                    const resp = await fetch('/api/admin/rewards', {
                      method: 'POST',
                      body: form
                    });
                    if (!resp.ok) {
                      const msg = await resp.json().catch(() => ({}));
                      throw new Error(msg?.error || `HTTP ${resp.status}`);
                    }

                    setIsCreateOpen(false);
                    setCreateForm({ name: '', description: '', points_required: '', category: 'cash', is_active: true, redeem_url: '', order_url: '' });
                    setLogoFile(null);
                    await loadRewards();
                  } catch (e: any) {
                    setCreateError(e?.message || 'Failed to create reward.');
                  } finally {
                    setSubmitting(false);
                  }
                }}>
                  {submitting ? 'Creating...' : 'Create Reward'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Reward Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 text-gray-900">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Reward</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">x</button>
              </div>
              <div className="p-6 space-y-4">
                {editError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 text-sm">{editError}</div>
                )}
                <div>
                  <Label className="text-sm text-gray-700">Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Reward name" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Description</Label>
                  <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Reward description" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-700">Points Required</Label>
                    <Input type="number" min={0} value={editForm.points_required} onChange={(e) => setEditForm({ ...editForm, points_required: e.target.value })} placeholder="e.g. 500" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Category</Label>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })} className="mt-1 w-full rounded-md px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
                      <option value="cash">Cash</option>
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                      <option value="voucher">Voucher</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-700">Redeem URL (Main App button)</Label>
                    <Input value={editForm.redeem_url || ''} onChange={(e) => setEditForm({ ...editForm, redeem_url: e.target.value })} placeholder="https://... (optional)" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700">Order URL (Main App button)</Label>
                    <Input value={editForm.order_url || ''} onChange={(e) => setEditForm({ ...editForm, order_url: e.target.value })} placeholder="https://... (optional)" className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input id="edit_is_active" type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="edit_is_active" className="text-sm text-gray-700">Active</Label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <Button variant="outline" className="border-gray-300" onClick={() => setIsEditOpen(false)} disabled={editSubmitting}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={editSubmitting} onClick={submitEdit}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

