"use client";

import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import "./globals.css";
import dynamic from "next/dynamic";

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const PwaLockOverlay = dynamic(() => import("@/components/PwaLockOverlay"), { ssr: false });
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/w yellow.png" />
        <link rel="shortcut icon" href="/w yellow.png" />
        <link rel="apple-touch-icon" href="/w yellow.png" />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="woza-mali-theme">
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PwaLockOverlay />
                {children}
              </TooltipProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
