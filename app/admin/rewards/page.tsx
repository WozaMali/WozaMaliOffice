import AdminRewards from "@/pages/AdminRewards";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminRewardsPage() {
  return (
    <AdminRoute>
      <AdminRewards />
    </AdminRoute>
  );
}
