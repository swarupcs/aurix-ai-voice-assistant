"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, ShieldAlert, Users, Volume2, Key, Database } from "lucide-react";

export default function AdminSettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage platform configurations, feature toggles, and AI behaviors globally.
        </p>
      </div>
      
      <div className="grid gap-8">
        {/* General Settings */}
        <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-xl">
                 <ShieldAlert className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-xl">General Configuration</CardTitle>
                <CardDescription className="mt-1">
                  Core platform availability and security settings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the platform for all non-admin users. This will redirect active users.
                </p>
              </div>
              <Switch className="scale-125" />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Debug Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Enable verbose logging in your Vercel/Node environment for troubleshooting.
                </p>
              </div>
              <Switch className="scale-125" />
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                 <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl">User & Authentication</CardTitle>
                <CardDescription className="mt-1">
                  Control registration policies and user access defaults.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle whether new users can register accounts on the platform.
                </p>
              </div>
              <Switch defaultChecked className="scale-125" />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold">Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Mandate email verification before users can consume the AI voice API.
                </p>
              </div>
              <Switch className="scale-125" />
            </div>
          </CardContent>
        </Card>

        {/* AI & Voice Defaults */}
        <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                 <Volume2 className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-xl">AI & Speech Configuration</CardTitle>
                <CardDescription className="mt-1">
                  Configure the default AI settings applied to all new sessions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-3 max-w-md">
              <Label className="text-base font-semibold">Default System Voice</Label>
              <Select defaultValue="Aoede">
                <SelectTrigger className="h-12 bg-background/50 border-white/10 text-base shadow-sm">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="shadow-2xl border-white/10 rounded-xl backdrop-blur-xl">
                  <SelectItem value="Aoede" className="py-2">Aoede</SelectItem>
                  <SelectItem value="Charon" className="py-2">Charon</SelectItem>
                  <SelectItem value="Fenrir" className="py-2">Fenrir</SelectItem>
                  <SelectItem value="Kore" className="py-2">Kore</SelectItem>
                  <SelectItem value="Puck" className="py-2">Puck</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                This voice will be used automatically if the user has not explicitly set a preference.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Placeholder */}
        <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                 <Key className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-xl">API Integrations</CardTitle>
                <CardDescription className="mt-1">
                  Manage third-party connections. (Managed via environment variables).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed bg-muted/20">
                <Database className="w-8 h-8 text-muted-foreground opacity-50" />
                <div>
                   <p className="font-semibold">Keys are secured in .env</p>
                   <p className="text-sm text-muted-foreground mt-1">For security reasons, API keys cannot be viewed or modified from this panel. Please update your environment variables and restart the server.</p>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Floating Save Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-[calc(50%+9rem)] z-50 animate-in slide-in-from-bottom-12 duration-700">
           <div className="bg-background/80 backdrop-blur-2xl border border-border/40 shadow-2xl p-4 rounded-3xl flex items-center justify-between gap-6 px-6">
              <div>
                 <p className="text-sm font-bold">Unsaved changes</p>
                 <p className="text-xs text-muted-foreground">You have modified 2 settings.</p>
              </div>
              <Button onClick={handleSave} size="lg" className="px-8 rounded-xl h-12 bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
