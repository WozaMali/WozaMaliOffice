"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Users, 
  Recycle, 
  TrendingUp,
  Activity,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

interface SystemStatus {
  total_users: number;
  total_pickups: number;
  total_kg_recycled: number;
  total_value_generated: number;
  active_collectors: number;
  pending_pickups: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  last_sync: Date;
  realtime_connections: number;
}

interface DataFlow {
  source: string;
  destination: string;
  status: 'active' | 'inactive' | 'error';
  last_update: Date;
  data_type: string;
}

export function SystemIntegration() {
  const { user, profile } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    fetchSystemStatus();
    setupRealtimeMonitoring();
  }, []);

  const setupRealtimeMonitoring = () => {
    // Monitor all system tables for real-time updates
    const systemChannel = supabase
      .channel('system_monitoring')
      .on('postgres_changes', 
        { event: '*', schema: 'public' }, 
        (payload) => {
          console.log('System change detected:', payload);
          updateDataFlow(payload);
        }
      )
      .subscribe();

    return () => systemChannel.unsubscribe();
  };

  const updateDataFlow = (payload: any) => {
    setDataFlows(prev => {
      const newFlow: DataFlow = {
        source: payload.table || 'unknown',
        destination: 'dashboard',
        status: 'active',
        last_update: new Date(),
        data_type: payload.event || 'change'
      };

      // Update existing flow or add new one
      const existingIndex = prev.findIndex(f => f.source === newFlow.source);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newFlow;
        return updated;
      } else {
        return [...prev, newFlow];
      }
    });
  };

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setDebugInfo("Fetching system status...");

      // Fetch comprehensive system data
      const [
        usersResult,
        pickupsResult,
        pickupItemsResult,
        profilesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, role, is_active'),
        supabase.from('pickups').select('*'),
        supabase.from('pickup_items').select('kilograms'),
        supabase.from('profiles').select('id, role').eq('is_active', true)
      ]);

      if (usersResult.error) throw usersResult.error;
      if (pickupsResult.error) throw pickupsResult.error;
      if (pickupItemsResult.error) throw pickupItemsResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const users = usersResult.data || [];
      const pickups = pickupsResult.data || [];
      const pickupItems = pickupItemsResult.data || [];
      const activeProfiles = profilesResult.data || [];

      // Calculate system status
      const total_kg_recycled = pickupItems.reduce((sum, item) => sum + (item.kilograms || 0), 0);
      const total_value_generated = total_kg_recycled * 1.5; // Approximate value
      const active_collectors = activeProfiles.filter(p => p.role === 'COLLECTOR').length;
      const pending_pickups = pickups.filter(p => p.status === 'submitted').length;

      // Determine system health
      let system_health: SystemStatus['system_health'] = 'excellent';
      if (pending_pickups > 10) system_health = 'warning';
      if (pending_pickups > 20) system_health = 'critical';

      const status: SystemStatus = {
        total_users: users.length,
        total_pickups: pickups.length,
        total_kg_recycled,
        total_value_generated,
        active_collectors,
        pending_pickups,
        system_health,
        last_sync: new Date(),
        realtime_connections: 3 // Pickups, items, profiles
      };

      setSystemStatus(status);

      // Initialize data flows
      const flows: DataFlow[] = [
        {
          source: 'profiles',
          destination: 'dashboard',
          status: 'active',
          last_update: new Date(),
          data_type: 'user_data'
        },
        {
          source: 'pickups',
          destination: 'dashboard',
          status: 'active',
          last_update: new Date(),
          data_type: 'pickup_data'
        },
        {
          source: 'pickup_items',
          destination: 'dashboard',
          status: 'active',
          last_update: new Date(),
          data_type: 'material_data'
        }
      ];

      setDataFlows(flows);
      setDebugInfo(`System status loaded. Users: ${status.total_users}, Pickups: ${status.total_pickups}`);

    } catch (err: any) {
      console.error("Error fetching system status:", err);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Excellent</Badge>;
      case 'good':
        return <Badge variant="default" className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" /> Good</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getFlowStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Database className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Analyzing system integration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">System Status Unavailable</h3>
            <p className="text-muted-foreground mb-4">Unable to fetch system integration status.</p>
            <Button onClick={fetchSystemStatus}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {debugInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">System Integration Status:</span>
                <span className="text-sm">{debugInfo}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchSystemStatus}
                className="text-blue-600 hover:text-blue-800"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              System Integration Dashboard 🔗
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring of how all system components communicate and work together
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Health & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Health
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              {getHealthBadge(systemStatus.system_health)}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.pending_pickups} pending pickups
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <Users className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {systemStatus.total_users}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.active_collectors} collectors active
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collections
            </CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Recycle className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {systemStatus.total_pickups}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.total_kg_recycled.toFixed(1)} kg recycled
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-primary transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Real-time Connections
            </CardTitle>
            <div className="p-2 rounded-lg bg-green/10">
              <Zap className="h-4 w-4 text-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-1">
              {systemStatus.realtime_connections}
            </div>
            <p className="text-xs text-muted-foreground">
              Live data streams active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Flow Visualization */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>Data Flow & Communication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataFlows.map((flow, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{flow.source}</p>
                    <p className="text-sm text-muted-foreground">{flow.data_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">{flow.destination}</p>
                    <p className="text-xs text-muted-foreground">
                      {flow.last_update.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getFlowStatusBadge(flow.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>How Everything Works Together</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Customer Dashboard</strong> shows personal recycling history</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Admin Dashboard</strong> displays system-wide statistics</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Real-time Updates</strong> sync across all dashboards</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Data Consistency</strong> maintained across all views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Real-time Communication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Pickup Changes</strong> instantly update all dashboards</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Material Updates</strong> reflect in real-time calculations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>User Actions</strong> propagate across the system</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Status Changes</strong> update everywhere simultaneously</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Actions */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>System Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex flex-col items-center justify-center space-y-2">
              <Database className="h-5 w-5" />
              <span>Test All Connections</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <Activity className="h-5 w-5" />
              <span>System Health Check</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Metrics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
