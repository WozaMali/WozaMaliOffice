import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Save,
  Database,
  Shield,
  Bell,
  Globe
} from "lucide-react";

export default function AdminConfig() {
  return (
    <AdminLayout currentPage="/admin/config">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600">Manage system settings and preferences</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>General Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="Woza Mali" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" defaultValue="admin@wozamali.co.za" />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" defaultValue="+27 82 123 4567" />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Africa/Johannesburg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <span>Database Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dbHost">Database Host</Label>
                <Input id="dbHost" defaultValue="localhost" />
              </div>
              <div>
                <Label htmlFor="dbPort">Database Port</Label>
                <Input id="dbPort" defaultValue="5432" />
              </div>
              <div>
                <Label htmlFor="dbName">Database Name</Label>
                <Input id="dbName" defaultValue="woza_mali" />
              </div>
              <div>
                <Label htmlFor="dbUser">Database User</Label>
                <Input id="dbUser" defaultValue="postgres" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" defaultValue="30" />
              </div>
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" defaultValue="5" />
              </div>
              <div>
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <Input id="passwordPolicy" defaultValue="Strong" />
              </div>
              <div>
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <Input id="twoFactorAuth" defaultValue="Enabled" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Input id="emailNotifications" defaultValue="Enabled" />
              </div>
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Input id="smsNotifications" defaultValue="Disabled" />
              </div>
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <Input id="pushNotifications" defaultValue="Enabled" />
              </div>
              <div>
                <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                <Input id="notificationFrequency" defaultValue="Daily" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
