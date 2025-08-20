import RecyclingCalculatorPage from "@/pages/RecyclingCalculatorPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CalculatorPage() {
  return (
    <ProtectedRoute>
      <RecyclingCalculatorPage />
    </ProtectedRoute>
  );
}
