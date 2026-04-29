"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, ShieldAlert, Users, Volume2 } from "lucide-react";

export default function AdminSettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage platform configurations, feature toggles, and AI behaviors.
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <CardTitle>General Configuration</CardTitle>
            </div>
            <CardDescription>
              Core platform availability and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the platform for all non-admin users.
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Debug Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Enable verbose logging for debugging system issues.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              Control registration and user access defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register an account on the platform.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Mandate email verification before users can use the AI voice features.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* AI & Voice Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <CardTitle>AI & Voice Defaults</CardTitle>
            </div>
            <CardDescription>
              Configure the default AI settings applied to new users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>Default System Voice</Label>
              <Select defaultValue="Aoede">
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aoede">Aoede</SelectItem>
                  <SelectItem value="Charon">Charon</SelectItem>
                  <SelectItem value="Fenrir">Fenrir</SelectItem>
                  <SelectItem value="Kore">Kore</SelectItem>
                  <SelectItem value="Puck">Puck</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                This voice will be used if the user has not set a preference.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="px-8">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
