import AdminPickups from "@/pages/AdminPickups";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminPickupsPage() {
  return (
    <AdminRoute>
      <AdminPickups />
    </AdminRoute>
  );
}
