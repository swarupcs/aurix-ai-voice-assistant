import { getUsers } from "@/server/actions/admin";
import { UserTable } from "./user-table";

export const metadata = {
  title: "Admin Panel - Users",
};

export default async function AdminPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users Management</h2>
        <p className="text-muted-foreground">
          View and manage all registered users, their roles, and data.
        </p>
      </div>
      
      <UserTable users={users} />
    </div>
  );
}
