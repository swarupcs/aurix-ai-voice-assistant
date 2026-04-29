import { getUsers } from "@/server/actions/admin";
import { UserTable } from "./user-table";

export const metadata = {
  title: "Admin Panel - Users",
};

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
        <p className="text-muted-foreground mt-2">
          View and manage all registered users, their roles, and platform data.
        </p>
      </div>
      
      <UserTable users={users} />
    </div>
  );
}
