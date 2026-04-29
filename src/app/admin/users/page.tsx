import { getUsers } from "@/server/actions/admin";
import { UserTable } from "./user-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export const metadata = {
  title: "Admin Panel - Users",
};

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground mt-2">
          View, search, and manage all registered users on the platform.
        </p>
      </div>

      <Card className="border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2">
             <div className="p-2.5 bg-primary/10 rounded-xl">
               <Users className="w-5 h-5 text-primary" />
             </div>
             <div>
                <CardTitle className="text-xl">User Directory</CardTitle>
                <CardDescription className="mt-1">
                  {users.length} total users found. Assign roles or remove accounts.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <UserTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}

