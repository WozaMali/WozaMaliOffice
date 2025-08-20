import AdminWithdrawals from "@/pages/AdminWithdrawals";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminWithdrawalsPage() {
  return (
    <AdminRoute>
      <AdminWithdrawals />
    </AdminRoute>
  );
}
