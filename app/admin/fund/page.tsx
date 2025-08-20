import AdminFund from "@/pages/AdminFund";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminFundPage() {
  return (
    <AdminRoute>
      <AdminFund />
    </AdminRoute>
  );
}
