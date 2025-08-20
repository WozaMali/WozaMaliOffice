"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const NotFound = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    );
  }, []);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'COLLECTOR') {
        router.push('/collector');
      } else {
        router.push('/admin');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
