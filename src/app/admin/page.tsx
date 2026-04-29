import { getAdminStats, getRecentUsers } from "@/server/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, Settings, TrendingUp, ShieldAlert, Cpu } from "lucide-react";
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Monitor your platform's statistics and recent activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1 */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
             <Users className="w-24 h-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500 font-medium">
               <TrendingUp className="w-3 h-3" />
               <span>+12% this week</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat Card 2 */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
             <MessageSquare className="w-24 h-24 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Conversations</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.totalConversations}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
               <span>Total voice sessions</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat Card 3 */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
             <Activity className="w-24 h-24 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Messages</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.totalMessages}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-500 font-medium">
               <TrendingUp className="w-3 h-3" />
               <span>High engagement</span>
            </div>
          </CardContent>
        </Card>

        {/* Stat Card 4 */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-background to-muted/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
             <Activity className="w-24 h-24 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Users</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeUsers}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
               <span>In the last 7 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-white/10 bg-background/60 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Settings className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Platform Version</p>
                    <p className="text-xs text-muted-foreground">Current deployment build</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-secondary rounded-full text-xs font-mono font-medium">v1.2.0-beta</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Database Connection</p>
                    <p className="text-xs text-muted-foreground">Prisma client status</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold">AI Services</p>
                    <p className="text-xs text-muted-foreground">Voice API endpoints</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </span>
              </div>
            </div>
            
            <Link href="/admin/settings" className="block pt-2">
              <Button className="w-full h-12 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none font-semibold group">
                <ShieldAlert className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Manage Advanced Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-white/10 bg-background/60 backdrop-blur-xl shadow-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Recent Registrations
            </CardTitle>
            <Link href="/admin/users" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              View Directory
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/40">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0) || user.email?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold leading-none truncate">{user.name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center shrink-0">
                    <span className="font-mono text-xs font-bold bg-secondary/50 text-secondary-foreground border px-2 py-1 rounded-lg shadow-sm">
                      {user._count.conversations} chats
                    </span>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No recent users found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
