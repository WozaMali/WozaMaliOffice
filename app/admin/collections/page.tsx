import AdminCollections from "@/pages/AdminCollections";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminCollectionsPage() {
  return (
    <AdminRoute>
      <AdminCollections />
    </AdminRoute>
  );
}
