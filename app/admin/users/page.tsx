import AdminUsers from "@/pages/AdminUsers";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsers />
    </AdminRoute>
  );
}
