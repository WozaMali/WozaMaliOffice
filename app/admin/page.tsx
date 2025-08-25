import AdminDashboardClient from './AdminDashboardClient';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  return <AdminDashboardClient />;
}
