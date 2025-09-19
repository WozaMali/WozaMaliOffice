'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import CreateAdminModal from '@/components/admin/CreateAdminModal';
import TeamMemberCard from '@/components/admin/TeamMemberCard';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  employee_number?: string;
  township?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_approved?: boolean;
  approval_date?: string;
  approved_by?: string;
}

export default function TeamMembersPage() {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [pendingCollectors, setPendingCollectors] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  // Check if user is superadmin
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'SUPER_ADMIN';

  // Load team members
  useEffect(() => {
    loadTeamMembers();
    loadPendingCollectors();
  }, []);

  // Filter team members
  useEffect(() => {
    let filtered = teamMembers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.township?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  }, [teamMembers, searchTerm, roleFilter, statusFilter]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Get all users with admin, staff, or collector roles
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          role_id,
          role,
          status,
          employee_number,
          township_id,
          subdivision,
          city,
          created_at,
          updated_at
        `)
        .in('role', ['admin', 'super_admin', 'collector', 'staff'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const members: TeamMember[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.phone,
        role: user.role || user.role_id,
        status: user.status,
        employee_number: user.employee_number,
        township: user.subdivision || user.city || 'Unknown',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: undefined, // Not available in current schema
        is_approved: user.status === 'active', // Use status to determine approval
        approval_date: user.status === 'active' ? user.updated_at : undefined,
        approved_by: undefined, // Not available in current schema
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCollectors = async () => {
    setLoadingPending(true);
    try {
      // Get pending collectors
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          role_id,
          role,
          status,
          employee_number,
          township_id,
          subdivision,
          city,
          created_at,
          updated_at
        `)
        .eq('status', 'pending_approval')
        .eq('role', 'collector')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const pending: TeamMember[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.phone,
        role: user.role || user.role_id,
        status: user.status,
        employee_number: user.employee_number,
        township: user.subdivision || user.city || 'Unknown',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: undefined,
        is_approved: false,
        approval_date: undefined,
        approved_by: undefined,
      })) || [];

      setPendingCollectors(pending);
    } catch (error) {
      console.error('Error loading pending collectors:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      // Reload team members and pending collectors
      loadTeamMembers();
      loadPendingCollectors();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      // Reload team members and pending collectors
      loadTeamMembers();
      loadPendingCollectors();
    } catch (error) {
      console.error('Error rejecting member:', error);
    }
  };

  const getStatusBadge = (status: string, isApproved?: boolean) => {
    if (status === 'pending_approval' || status === 'pending') {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'super_admin': 'bg-yellow-100 text-yellow-800',
      'admin': 'bg-blue-100 text-blue-800',
      'staff': 'bg-green-100 text-green-800',
      'collector': 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        <Shield className="w-3 h-3 mr-1" />
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Super Administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Team Members
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage admin profiles and approve collector requests
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowCreateAdmin(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin Profile
            </Button>
            <Badge className="text-sm bg-gradient-to-r from-green-600 to-green-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              <Users className="w-4 h-4 mr-2" />
              {teamMembers.length} Members
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{teamMembers.length}</div>
              <p className="text-sm text-gray-600 mt-1">
                Active: {teamMembers.filter(m => m.status === 'active').length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {teamMembers.filter(m => m.status === 'pending_approval' || m.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'admin' || m.role === 'super_admin').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Administrative staff
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Collectors</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'collector').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Field collectors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
            <p className="text-gray-300">Filter and search through team members</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, employee number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="collector">Collector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Collectors Section */}
        {pendingCollectors.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                Pending Collector Approvals
                <Badge className="bg-white text-yellow-600 border-0 px-3 py-1 rounded-full">
                  {pendingCollectors.length}
                </Badge>
              </CardTitle>
              <p className="text-yellow-100">
                Review and approve collector signup requests
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCollectors.map((collector) => (
                  <TeamMemberCard
                    key={collector.id}
                    member={collector}
                    onApprove={() => handleApproveMember(collector.id)}
                    onReject={() => handleRejectMember(collector.id)}
                    getStatusBadge={getStatusBadge}
                    getRoleBadge={getRoleBadge}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
            <Badge className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 px-4 py-2 rounded-full shadow-lg">
              {filteredMembers.length} Members
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onApprove={() => handleApproveMember(member.id)}
                onReject={() => handleRejectMember(member.id)}
                getStatusBadge={getStatusBadge}
                getRoleBadge={getRoleBadge}
              />
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No team members found</h3>
                <p className="text-gray-600 text-center max-w-md">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by creating an admin profile or wait for collector signups.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <CreateAdminModal
            isOpen={showCreateAdmin}
            onClose={() => setShowCreateAdmin(false)}
            onSuccess={() => {
              setShowCreateAdmin(false);
              loadTeamMembers();
            }}
          />
        )}
      </div>
    </div>
  );
}
