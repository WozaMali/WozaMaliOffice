'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  Package, 
  TreePine, 
  Leaf, 
  Droplets, 
  Mountain,
  BarChart3,
  Activity,
  Calendar,
  Target
} from 'lucide-react';
import { 
  getSystemImpact, 
  getMaterialPerformance, 
  getCollectorPerformance, 
  getCustomerPerformance,
  formatCurrency,
  formatWeight,
  formatDate
} from '@/lib/admin-services';
import { exportToCSV, exportToXLSX, exportToPDF } from '@/lib/export-utils';
import { 
  SystemImpactView, 
  MaterialPerformanceView, 
  CollectorPerformanceView, 
  CustomerPerformanceView 
} from '@/lib/supabase';

export default function AnalyticsPage() {
  const [systemImpact, setSystemImpact] = useState<SystemImpactView | null>(null);
  const [materialPerformance, setMaterialPerformance] = useState<MaterialPerformanceView[]>([]);
  const [collectorPerformance, setCollectorPerformance] = useState<CollectorPerformanceView[]>([]);
  const [customerPerformance, setCustomerPerformance] = useState<CustomerPerformanceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [impact, materials, collectors, customers] = await Promise.all([
        getSystemImpact(),
        getMaterialPerformance(),
        getCollectorPerformance(),
        getCustomerPerformance()
      ]);
      
      setSystemImpact(impact as any);
      setMaterialPerformance(materials as any);
      setCollectorPerformance(collectors as any);
      setCustomerPerformance(customers as any);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive system analytics and reporting</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* System Impact Overview */}
      {systemImpact && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemImpact.total_pickups}</div>
              <p className="text-xs text-muted-foreground">
                Pending: {systemImpact.pending_pickups}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(systemImpact.total_kg_collected)}</div>
              <p className="text-xs text-muted-foreground">
                Recycled material
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(systemImpact.total_value_generated)}</div>
              <p className="text-xs text-muted-foreground">
                Generated revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemImpact.unique_customers + systemImpact.unique_collectors}
              </div>
              <p className="text-xs text-muted-foreground">
                Customers: {systemImpact.unique_customers}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Environmental Impact */}
      {systemImpact && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemImpact.total_co2_saved.toFixed(1)} kg
              </div>
              <p className="text-xs text-muted-foreground">
                Carbon dioxide equivalent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water Saved</CardTitle>
              <Droplets className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemImpact.total_water_saved.toFixed(1)} L
              </div>
              <p className="text-xs text-muted-foreground">
                Liters of water
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Landfill Saved</CardTitle>
              <Mountain className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatWeight(systemImpact.total_landfill_saved)}
              </div>
              <p className="text-xs text-muted-foreground">
                Waste diverted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Equivalent</CardTitle>
              <TreePine className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {systemImpact.total_trees_equivalent.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Trees planted equivalent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Material Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Material Performance
          </CardTitle>
          <CardDescription>
            Performance metrics by material type
          </CardDescription>
          <div className="mt-2 flex gap-2">
            <button className="text-sm underline" onClick={() => exportToCSV('material_performance.csv', ['Material','Category','Rate/kg','Pickups','Total Weight','Total Value','Avg per Pickup'], materialPerformance.map(m => ({
              'Material': m.material_name,
              'Category': m.category,
              'Rate/kg': m.rate_per_kg,
              'Pickups': m.pickup_count,
              'Total Weight': m.total_kg_collected,
              'Total Value': m.total_value_generated,
              'Avg per Pickup': m.avg_kg_per_pickup
            })))}>Download CSV</button>
            <button className="text-sm underline" onClick={() => exportToXLSX('material_performance.xlsx', 'Materials', ['Material','Category','Rate/kg','Pickups','Total Weight','Total Value','Avg per Pickup'], materialPerformance.map(m => ({
              'Material': m.material_name,
              'Category': m.category,
              'Rate/kg': m.rate_per_kg,
              'Pickups': m.pickup_count,
              'Total Weight': m.total_kg_collected,
              'Total Value': m.total_value_generated,
              'Avg per Pickup': m.avg_kg_per_pickup
            })), '/Woza Mali logo white.png')}>Download Excel</button>
            <button className="text-sm underline" onClick={() => exportToPDF('Material Performance', 'material_performance.pdf', ['Material','Category','Rate/kg','Pickups','Total Weight','Total Value','Avg per Pickup'], materialPerformance.map(m => ({
              'Material': m.material_name,
              'Category': m.category,
              'Rate/kg': m.rate_per_kg,
              'Pickups': m.pickup_count,
              'Total Weight': m.total_kg_collected,
              'Total Value': m.total_value_generated,
              'Avg per Pickup': m.avg_kg_per_pickup
            })), '/Woza Mali logo white.png')}>Download PDF</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rate/kg</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pickups</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Weight</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg per Pickup</th>
                </tr>
              </thead>
              <tbody>
                {materialPerformance.map((material) => (
                  <tr key={material.material_name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{material.material_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{material.category}</Badge>
                    </td>
                    <td className="py-3 px-4">{formatCurrency(material.rate_per_kg)}</td>
                    <td className="py-3 px-4">{material.pickup_count}</td>
                    <td className="py-3 px-4">{formatWeight(material.total_kg_collected)}</td>
                    <td className="py-3 px-4">{formatCurrency(material.total_value_generated)}</td>
                    <td className="py-3 px-4">{formatWeight(material.avg_kg_per_pickup)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Collectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Collectors
          </CardTitle>
          <CardDescription>
            Performance ranking of field collectors
          </CardDescription>
          <div className="mt-2 flex gap-2">
            <button className="text-sm underline" onClick={() => exportToCSV('top_collectors.csv', ['Collector','Email','Pickups','Weight','Value','CO2 Saved'], collectorPerformance.map(c => ({
              'Collector': c.collector_name,
              'Email': c.collector_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_collected,
              'Value': c.total_value_generated,
              'CO2 Saved': c.total_co2_saved
            })))}>Download CSV</button>
            <button className="text-sm underline" onClick={() => exportToXLSX('top_collectors.xlsx', 'Collectors', ['Collector','Email','Pickups','Weight','Value','CO2 Saved'], collectorPerformance.map(c => ({
              'Collector': c.collector_name,
              'Email': c.collector_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_collected,
              'Value': c.total_value_generated,
              'CO2 Saved': c.total_co2_saved
            })), '/Woza Mali logo white.png')}>Download Excel</button>
            <button className="text-sm underline" onClick={() => exportToPDF('Top Collectors', 'top_collectors.pdf', ['Collector','Email','Pickups','Weight','Value','CO2 Saved'], collectorPerformance.map(c => ({
              'Collector': c.collector_name,
              'Email': c.collector_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_collected,
              'Value': c.total_value_generated,
              'CO2 Saved': c.total_co2_saved
            })), '/Woza Mali logo white.png')}>Download PDF</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collectorPerformance.slice(0, 6).map((collector, index) => (
              <div key={collector.collector_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{collector.collector_name}</div>
                      <div className="text-sm text-gray-500">{collector.collector_email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Pickups</div>
                    <div className="font-medium">{collector.total_pickups}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Weight</div>
                    <div className="font-medium">{formatWeight(collector.total_kg_collected)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Value</div>
                    <div className="font-medium">{formatCurrency(collector.total_value_generated)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">CO₂ Saved</div>
                    <div className="font-medium">{collector.total_co2_saved.toFixed(1)} kg</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Customers
          </CardTitle>
          <CardDescription>
            Most active recycling customers
          </CardDescription>
          <div className="mt-2 flex gap-2">
            <button className="text-sm underline" onClick={() => exportToCSV('top_customers.csv', ['Resident','Email','Pickups','Weight','Earned','Wallet'], customerPerformance.map(c => ({
              'Resident': c.customer_name,
              'Email': c.customer_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_recycled,
              'Earned': c.total_value_earned,
              'Wallet': c.total_wallet_balance
            })))}>Download CSV</button>
            <button className="text-sm underline" onClick={() => exportToXLSX('top_customers.xlsx', 'Residents', ['Resident','Email','Pickups','Weight','Earned','Wallet'], customerPerformance.map(c => ({
              'Resident': c.customer_name,
              'Email': c.customer_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_recycled,
              'Earned': c.total_value_earned,
              'Wallet': c.total_wallet_balance
            })), '/Woza Mali logo white.png')}>Download Excel</button>
            <button className="text-sm underline" onClick={() => exportToPDF('Top Residents', 'top_residents.pdf', ['Resident','Email','Pickups','Weight','Earned','Wallet'], customerPerformance.map(c => ({
              'Resident': c.customer_name,
              'Email': c.customer_email,
              'Pickups': c.total_pickups,
              'Weight': c.total_kg_recycled,
              'Earned': c.total_value_earned,
              'Wallet': c.total_wallet_balance
            })), '/Woza Mali logo white.png')}>Download PDF</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerPerformance.slice(0, 6).map((customer, index) => (
              <div key={customer.customer_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{customer.customer_name}</div>
                      <div className="text-sm text-gray-500">{customer.customer_email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Pickups</div>
                    <div className="font-medium">{customer.total_pickups}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Weight</div>
                    <div className="font-medium">{formatWeight(customer.total_kg_recycled)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Earned</div>
                    <div className="font-medium">{formatCurrency(customer.total_value_earned)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Wallet</div>
                    <div className="font-medium">{formatCurrency(customer.total_wallet_balance)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
