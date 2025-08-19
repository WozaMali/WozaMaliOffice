import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminRewards from "./pages/AdminRewards";
import AdminFund from "./pages/AdminFund";
import AdminCollections from "./pages/AdminCollections";
import AdminPickups from "./pages/AdminPickups";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminConfig from "./pages/AdminConfig";
import RecyclingCalculatorPage from "./pages/RecyclingCalculatorPage";
import CollectorDashboard from "./pages/CollectorDashboard";
import CollectorLogin from "./pages/CollectorLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, AdminRoute, CollectorRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="woza-mali-theme">
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
              <Route path="/admin/rewards" element={<AdminRoute><AdminRewards /></AdminRoute>} />
              <Route path="/admin/fund" element={<AdminRoute><AdminFund /></AdminRoute>} />
              <Route path="/admin/collections" element={<AdminRoute><AdminCollections /></AdminRoute>} />
              <Route path="/admin/pickups" element={<AdminRoute><AdminPickups /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><RecyclingCalculatorPage /></ProtectedRoute>} />
              <Route path="/collector" element={<CollectorRoute><CollectorDashboard /></CollectorRoute>} />
              <Route path="/collector-login" element={<CollectorLogin />} />
              <Route path="/customer" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
