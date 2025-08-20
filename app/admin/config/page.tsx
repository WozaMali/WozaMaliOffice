import AdminConfig from "@/pages/AdminConfig";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminConfigPage() {
  return (
    <AdminRoute>
      <AdminConfig />
    </AdminRoute>
  );
}
