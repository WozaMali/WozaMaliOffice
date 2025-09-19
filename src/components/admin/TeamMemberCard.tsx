'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  UserCheck, 
  UserX, 
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

interface TeamMemberCardProps {
  member: TeamMember;
  onApprove: () => void;
  onReject: () => void;
  getStatusBadge: (status: string, isApproved?: boolean) => React.ReactNode;
  getRoleBadge: (role: string) => React.ReactNode;
}

export default function TeamMemberCard({ 
  member, 
  onApprove, 
  onReject, 
  getStatusBadge, 
  getRoleBadge 
}: TeamMemberCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPending = member.status === 'pending' || member.status === 'pending_approval' || !member.is_approved;
  const canApprove = isPending && (member.role === 'collector' || member.role === 'staff' || member.role === 'COLLECTOR' || member.role === 'STAFF');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {member.full_name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              {getRoleBadge(member.role)}
              {getStatusBadge(member.status, member.is_approved)}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canApprove && (
                <>
                  <DropdownMenuItem onClick={onApprove} className="text-green-600">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onReject} className="text-red-600">
                    <UserX className="w-4 h-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{member.email}</span>
          </div>
          
          {member.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{member.phone}</span>
            </div>
          )}
          
          {member.township && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{member.township}</span>
            </div>
          )}
        </div>

        {/* Employee Information */}
        {member.employee_number && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Employee #:</span>
              <span className="ml-2 text-gray-600">{member.employee_number}</span>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="pt-2 border-t border-gray-100 space-y-1">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-2" />
            <span>Created: {formatDate(member.created_at)}</span>
          </div>
          
          {member.last_login && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-2" />
              <span>Last login: {formatDate(member.last_login)}</span>
            </div>
          )}
          
          {member.approval_date && (
            <div className="flex items-center text-xs text-gray-500">
              <CheckCircle className="w-3 h-3 mr-2" />
              <span>Approved: {formatDate(member.approval_date)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons for Pending Members */}
        {canApprove && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <Button
                onClick={onApprove}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={onReject}
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
              >
                <UserX className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
