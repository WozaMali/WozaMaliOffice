import AdminDashboard from "@/pages/AdminDashboard";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
