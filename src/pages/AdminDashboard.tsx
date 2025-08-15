import { AdminLayout } from "@/components/AdminLayout";
import { DashboardMetrics } from "@/components/DashboardMetrics";

const AdminDashboard = () => {
  return (
    <AdminLayout currentPage="dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">Welcome back, Admin!</h2>
          <p className="text-primary-foreground/90">
            Here's what's happening with Woza Mali today. Keep making recycling simple!
          </p>
        </div>

        {/* Main Metrics */}
        <DashboardMetrics />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;