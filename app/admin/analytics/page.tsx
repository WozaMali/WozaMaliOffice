import AdminAnalytics from "@/pages/AdminAnalytics";
import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminAnalyticsPage() {
  return (
    <AdminRoute>
      <AdminAnalytics />
    </AdminRoute>
  );
}
