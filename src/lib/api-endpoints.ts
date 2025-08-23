import { unifiedDataService } from './unified-data-service';

// API Response wrapper for consistent structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  endpoint: string;
}

// API Endpoints class for external consumption
export class ApiEndpoints {
  private static instance: ApiEndpoints;
  
  public static getInstance(): ApiEndpoints {
    if (!ApiEndpoints.instance) {
      ApiEndpoints.instance = new ApiEndpoints();
    }
    return ApiEndpoints.instance;
  }

  // Generic response wrapper
  private createResponse<T>(
    success: boolean, 
    data?: T, 
    error?: string, 
    endpoint: string
  ): ApiResponse<T> {
    return {
      success,
      data,
      error,
      timestamp: new Date().toISOString(),
      endpoint
    };
  }

  // Get all pickups with optional filtering
  async getPickups(filters?: {
    status?: string;
    customer_id?: string;
    collector_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      const result = await unifiedDataService.getUnifiedPickups(filters);
      
      if (result.error) {
        return this.createResponse(false, undefined, result.error, '/api/pickups');
      }
      
      return this.createResponse(true, result.data, undefined, '/api/pickups');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/pickups');
    }
  }

  // Get pickup by ID
  async getPickupById(id: string): Promise<ApiResponse<any>> {
    try {
      const result = await unifiedDataService.getUnifiedPickups({ limit: 1 });
      const pickup = result.data.find(p => p.id === id);
      
      if (!pickup) {
        return this.createResponse(false, undefined, 'Pickup not found', `/api/pickups/${id}`);
      }
      
      return this.createResponse(true, pickup, undefined, `/api/pickups/${id}`);
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, `/api/pickups/${id}`);
    }
  }

  // Get all customers
  async getCustomers(filters?: {
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      const result = await unifiedDataService.getUnifiedCustomers(filters);
      
      if (result.error) {
        return this.createResponse(false, undefined, result.error, '/api/customers');
      }
      
      return this.createResponse(true, result.data, undefined, '/api/customers');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/customers');
    }
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<ApiResponse<any>> {
    try {
      const result = await unifiedDataService.getUnifiedCustomers({ limit: 1 });
      const customer = result.data.find(c => c.id === id);
      
      if (!customer) {
        return this.createResponse(false, undefined, 'Customer not found', `/api/customers/${id}`);
      }
      
      return this.createResponse(true, customer, undefined, `/api/customers/${id}`);
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, `/api/customers/${id}`);
    }
  }

  // Get all collectors
  async getCollectors(filters?: {
    is_active?: boolean;
    is_available?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    try {
      const result = await unifiedDataService.getUnifiedCollectors(filters);
      
      if (result.error) {
        return this.createResponse(false, undefined, result.error, '/api/collectors');
      }
      
      return this.createResponse(true, result.data, undefined, '/api/collectors');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/collectors');
    }
  }

  // Get collector by ID
  async getCollectorById(id: string): Promise<ApiResponse<any>> {
    try {
      const result = await unifiedDataService.getUnifiedCollectors({ limit: 1 });
      const collector = result.data.find(c => c.id === id);
      
      if (!collector) {
        return this.createResponse(false, undefined, 'Collector not found', `/api/collectors/${id}`);
      }
      
      return this.createResponse(true, collector, undefined, `/api/collectors/${id}`);
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, `/api/collectors/${id}`);
    }
  }

  // Get system statistics
  async getSystemStats(): Promise<ApiResponse<any>> {
    try {
      const result = await unifiedDataService.getUnifiedSystemStats();
      
      if (result.error) {
        return this.createResponse(false, undefined, result.error, '/api/system/stats');
      }
      
      return this.createResponse(true, result.data, undefined, '/api/system/stats');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/system/stats');
    }
  }

  // Get dashboard data (combined view)
  async getDashboardData(role: 'ADMIN' | 'COLLECTOR', userId?: string): Promise<ApiResponse<any>> {
    try {
      const [pickupsResult, customersResult, collectorsResult, statsResult] = await Promise.all([
        unifiedDataService.getUnifiedPickups({
          limit: 50,
          ...(role === 'COLLECTOR' && userId && { collector_id: userId })
        }),
        unifiedDataService.getUnifiedCustomers({ limit: 50 }),
        unifiedDataService.getUnifiedCollectors({ limit: 50 }),
        unifiedDataService.getUnifiedSystemStats()
      ]);

      if (pickupsResult.error || customersResult.error || collectorsResult.error || statsResult.error) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = {
        pickups: pickupsResult.data,
        customers: customersResult.data,
        collectors: collectorsResult.data,
        systemStats: statsResult.data,
        role,
        timestamp: new Date().toISOString()
      };

      return this.createResponse(true, dashboardData, undefined, '/api/dashboard');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/dashboard');
    }
  }

  // Search functionality
  async search(query: string, type: 'pickups' | 'customers' | 'collectors' | 'all'): Promise<ApiResponse<any>> {
    try {
      let results: any = {};

      if (type === 'pickups' || type === 'all') {
        const pickupsResult = await unifiedDataService.getUnifiedPickups({ limit: 100 });
        if (!pickupsResult.error) {
          results.pickups = pickupsResult.data.filter(p => 
            p.customer.full_name.toLowerCase().includes(query.toLowerCase()) ||
            p.address.line1.toLowerCase().includes(query.toLowerCase()) ||
            p.address.suburb.toLowerCase().includes(query.toLowerCase()) ||
            p.address.city.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      if (type === 'customers' || type === 'all') {
        const customersResult = await unifiedDataService.getUnifiedCustomers({ limit: 100 });
        if (!customersResult.error) {
          results.customers = customersResult.data.filter(c => 
            c.full_name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      if (type === 'collectors' || type === 'all') {
        const collectorsResult = await unifiedDataService.getUnifiedCollectors({ limit: 100 });
        if (!collectorsResult.error) {
          results.collectors = collectorsResult.data.filter(c => 
            c.full_name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      return this.createResponse(true, results, undefined, `/api/search?q=${query}&type=${type}`);
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, `/api/search?q=${query}&type=${type}`);
    }
  }

  // Get analytics data
  async getAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<any>> {
    try {
      const statsResult = await unifiedDataService.getUnifiedSystemStats();
      
      if (statsResult.error) {
        throw new Error('Failed to fetch analytics data');
      }

      // Calculate time-based analytics
      const now = new Date();
      const timeRanges = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      };

      const analyticsData = {
        timeRange,
        currentStats: statsResult.data,
        trends: {
          pickupsGrowth: Math.random() * 20 - 10, // Mock data - replace with real calculations
          revenueGrowth: Math.random() * 15 - 5,
          customerGrowth: Math.random() * 25 - 15,
          efficiencyScore: Math.random() * 40 + 60
        },
        topPerformers: {
          topCustomers: [], // Would be populated with real data
          topCollectors: [], // Would be populated with real data
          topMaterials: [] // Would be populated with real data
        },
        generatedAt: new Date().toISOString()
      };

      return this.createResponse(true, analyticsData, undefined, `/api/analytics?range=${timeRange}`);
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, `/api/analytics?range=${timeRange}`);
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const statsResult = await unifiedDataService.getUnifiedSystemStats();
      
      const healthData = {
        status: 'healthy',
        database: statsResult.error ? 'disconnected' : 'connected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
      };

      return this.createResponse(true, healthData, undefined, '/api/health');
    } catch (error: any) {
      return this.createResponse(false, undefined, error.message, '/api/health');
    }
  }
}

// Export singleton instance
export const apiEndpoints = ApiEndpoints.getInstance();

// Export types for external use
export type {
  ApiResponse
};
