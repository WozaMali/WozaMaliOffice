import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Leaf,
  DollarSign,
  MessageSquare,
  Calendar,
  MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { customerServices, pickupServices } from "@/lib/supabase-services";
import type { CustomerProfile, Pickup } from "@/lib/supabase";
import { formatCurrency, formatWeight, formatPoints } from "@/lib/recycling-schema";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
  const [feedback, setFeedback] = useState('');

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get customer profile
        const profile = await customerServices.getCustomerProfile(user.id);
        setCustomerProfile(profile);

        // Get customer pickups
        if (profile?.email) {
          const customerPickups = await pickupServices.getPickupsByCustomer(profile.email);
          setPickups(customerPickups);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [user]);

  const handleSubmitFeedback = async () => {
    if (!selectedPickup || !feedback.trim()) return;

    try {
      const success = await pickupServices.addCustomerFeedback(selectedPickup.id, feedback);
      if (success) {
        alert('Feedback submitted successfully!');
        // Update local state
        setPickups(prev => prev.map(p => 
          p.id === selectedPickup.id 
            ? { ...p, customer_feedback: feedback }
            : p
        ));
        setSelectedPickup(null);
        setFeedback('');
      } else {
        alert('Error submitting feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!customerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact support to set up your customer profile.</p>
        </div>
      </div>
    );
  }

  const completedPickups = pickups.filter(p => p.status === 'completed');
  const pendingPickups = pickups.filter(p => p.status === 'pending');
  const approvedPickups = pickups.filter(p => p.status === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {customerProfile.full_name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Leaf className="h-4 w-4 mr-1" />
                {formatWeight(customerProfile.total_recycled_kg)} Recycled
              </Badge>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <DollarSign className="h-4 w-4 mr-1" />
                {formatCurrency(customerProfile.total_earned_money)} Earned
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pickups" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Pickups ({pickups.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingPickups.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedPickups.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Pickups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pickups.length}</div>
                  <p className="text-xs opacity-90 mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-success text-success-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Recycled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatWeight(customerProfile.total_recycled_kg)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-accent text-accent-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatPoints(customerProfile.total_earned_points)}</div>
                  <p className="text-xs opacity-90 mt-1">Earned</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-warm text-warm-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(customerProfile.total_earned_money)}</div>
                  <p className="text-xs opacity-90 mt-1">Lifetime total</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Pickup Activity</CardTitle>
                <CardDescription>Your latest recycling contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {pickups.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pickups yet</p>
                    <p className="text-sm text-muted-foreground">Start recycling to see your activity here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pickups.slice(0, 5).map((pickup) => (
                      <div key={pickup.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{pickup.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{pickup.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pickup.pickup_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(pickup.status)}>
                            {getStatusIcon(pickup.status)}
                            <span className="ml-1 capitalize">{pickup.status}</span>
                          </Badge>
                          <Badge className={getPaymentStatusColor(pickup.payment_status)}>
                            <DollarSign className="h-3 w-3 mr-1" />
                            {pickup.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Pickups Tab */}
          <TabsContent value="pickups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All My Pickups</CardTitle>
                <CardDescription>Complete history of your recycling contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {pickups.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pickups found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pickups.map((pickup) => (
                      <div key={pickup.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{pickup.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{pickup.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pickup.pickup_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(pickup.status)}>
                              {getStatusIcon(pickup.status)}
                              <span className="ml-1 capitalize">{pickup.status}</span>
                            </Badge>
                            <Badge className={getPaymentStatusColor(pickup.payment_status)}>
                              <DollarSign className="h-3 w-3 mr-1" />
                              {pickup.payment_status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center mb-3">
                          <div>
                            <div className="text-lg font-bold text-primary">
                              {formatWeight(pickup.total_kg)}
                            </div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">
                              {formatCurrency(pickup.total_value)}
                            </div>
                            <p className="text-xs text-muted-foreground">Value</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-accent">
                              {formatPoints(pickup.total_points)}
                            </div>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                        </div>

                        {pickup.notes && (
                          <div className="p-3 rounded-lg bg-muted/50 mb-3">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {pickup.notes}
                            </p>
                          </div>
                        )}

                        {pickup.admin_notes && (
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 mb-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              <strong>Admin Notes:</strong> {pickup.admin_notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {pickup.status === 'completed' && !pickup.customer_feedback && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPickup(pickup)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Feedback
                            </Button>
                          )}
                          
                          {pickup.customer_feedback && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                              <p className="text-sm text-green-700 dark:text-green-300">
                                <strong>Your Feedback:</strong> {pickup.customer_feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Pickups</CardTitle>
                <CardDescription>Pickups waiting for admin approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPickups.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending pickups</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPickups.map((pickup) => (
                      <div key={pickup.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{pickup.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{pickup.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pickup.pickup_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(pickup.status)}>
                            {getStatusIcon(pickup.status)}
                            <span className="ml-1 capitalize">{pickup.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-primary">
                              {formatWeight(pickup.total_kg)}
                            </div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">
                              {formatCurrency(pickup.total_value)}
                            </div>
                            <p className="text-xs text-muted-foreground">Value</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-accent">
                              {formatPoints(pickup.total_points)}
                            </div>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Pickups</CardTitle>
                <CardDescription>Successfully completed recycling pickups</CardDescription>
              </CardHeader>
              <CardContent>
                {completedPickups.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No completed pickups</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedPickups.map((pickup) => (
                      <div key={pickup.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{pickup.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{pickup.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pickup.pickup_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(pickup.status)}>
                              {getStatusIcon(pickup.status)}
                              <span className="ml-1 capitalize">{pickup.status}</span>
                            </Badge>
                            <Badge className={getPaymentStatusColor(pickup.payment_status)}>
                              <DollarSign className="h-3 w-3 mr-1" />
                              {pickup.payment_status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center mb-3">
                          <div>
                            <div className="text-lg font-bold text-primary">
                              {formatWeight(pickup.total_kg)}
                            </div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">
                              {formatCurrency(pickup.total_value)}
                            </div>
                            <p className="text-xs text-muted-foreground">Value</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-accent">
                              {formatPoints(pickup.total_points)}
                            </div>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                        </div>

                        {!pickup.customer_feedback && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPickup(pickup)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Feedback
                          </Button>
                        )}
                        
                        {pickup.customer_feedback && (
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              <strong>Your Feedback:</strong> {pickup.customer_feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Feedback Modal */}
      {selectedPickup && (
        <Card className="fixed inset-4 z-50 overflow-y-auto bg-background border shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Feedback for Pickup #{selectedPickup.id.slice(-8)}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPickup(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Pickup Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {new Date(selectedPickup.pickup_date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Weight:</span> {formatWeight(selectedPickup.total_kg)}
                </div>
                <div>
                  <span className="font-medium">Value:</span> {formatCurrency(selectedPickup.total_value)}
                </div>
                <div>
                  <span className="font-medium">Points:</span> {formatPoints(selectedPickup.total_points)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Your Feedback</label>
              <Textarea
                placeholder="Share your experience with this pickup..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback} disabled={!feedback.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>
              <Button variant="outline" onClick={() => setSelectedPickup(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
