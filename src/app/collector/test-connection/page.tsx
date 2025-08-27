"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function TestConnectionPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    // Simulate connection test
    setTimeout(() => {
      setIsConnected(true);
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Test Connection</h1>
        <p className="text-muted-foreground">Test your database and network connections</p>
      </div>

      <Card className="shadow-elegant max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5 text-primary" />
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
