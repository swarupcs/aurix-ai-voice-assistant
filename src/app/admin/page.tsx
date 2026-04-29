import { getAdminStats, getRecentUsers } from "@/server/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Panel - Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const recentUsers = await getRecentUsers(5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Monitor your platform's statistics and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered on the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">Total voice sessions held</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Exchanged between users and AI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-slate-50 dark:bg-zinc-900/50 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Version</span>
                <span className="text-muted-foreground">v1.2.0-beta</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Database Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">AI Service Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </span>
              </div>
            </div>
            <Link href="/admin/settings" className="block">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Manage System Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Link href="/admin/users" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs bg-secondary px-2 py-1 rounded-md">
                    {user._count.conversations} chats
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
