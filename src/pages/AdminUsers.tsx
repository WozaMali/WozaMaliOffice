import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Edit, Crown, Star, Gem } from "lucide-react";

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+27 82 123 4567",
    tier: "Gold",
    totalKgRecycled: 45.2,
    joinDate: "2024-01-15",
    status: "Active"
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+27 71 987 6543",
    tier: "Platinum",
    totalKgRecycled: 128.7,
    joinDate: "2023-11-22",
    status: "Active"
  },
  {
    id: "3",
    name: "Nomsa Mthembu", 
    email: "nomsa.m@email.com",
    phone: "+27 83 555 7890",
    tier: "Diamond",
    totalKgRecycled: 256.3,
    joinDate: "2023-09-10",
    status: "Active"
  },
  {
    id: "4",
    name: "David Williams",
    email: "d.williams@email.com", 
    phone: "+27 84 444 1234",
    tier: "Gold",
    totalKgRecycled: 67.8,
    joinDate: "2024-02-28",
    status: "Inactive"
  }
];

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'Gold': return <Crown className="h-4 w-4" />;
    case 'Platinum': return <Star className="h-4 w-4" />;
    case 'Diamond': return <Gem className="h-4 w-4" />;
    default: return null;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Gold': return 'bg-warning text-warning-foreground';
    case 'Platinum': return 'bg-info text-info-foreground'; 
    case 'Diamond': return 'bg-primary text-primary-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "all" || user.tier === tierFilter;
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesTier && matchesStatus;
  });

  const tierStats = {
    total: mockUsers.length,
    gold: mockUsers.filter(u => u.tier === 'Gold').length,
    platinum: mockUsers.filter(u => u.tier === 'Platinum').length,
    diamond: mockUsers.filter(u => u.tier === 'Diamond').length
  };

  return (
    <AdminLayout currentPage="users">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{tierStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Crown className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-foreground">{tierStats.gold}</div>
                <p className="text-sm text-muted-foreground">Gold Tier</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Star className="h-5 w-5 text-info" />
              <div>
                <div className="text-2xl font-bold text-foreground">{tierStats.platinum}</div>
                <p className="text-sm text-muted-foreground">Platinum Tier</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-2">
              <Gem className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{tierStats.diamond}</div>
                <p className="text-sm text-muted-foreground">Diamond Tier</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage recycling community members and their tier progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>KG Recycled</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.phone}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTierColor(user.tier)} flex items-center space-x-1 w-fit`}>
                          {getTierIcon(user.tier)}
                          <span>{user.tier}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.totalKgRecycled} kg
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;