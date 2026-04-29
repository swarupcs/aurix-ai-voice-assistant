"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { updateUserRole, deleteUser } from "@/server/actions/admin";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Shield, User as UserIcon, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UserTable({ users }: { users: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success("Role updated successfully");
    } else {
      toast.error(result.error || "Failed to update role");
    }
    setLoading(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setLoading(userToDelete);
    const result = await deleteUser(userToDelete);
    if (result.success) {
      toast.success("User deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete user");
    }
    setUserToDelete(null);
    setLoading(null);
  };

  const filteredUsers = users.filter((user) => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shadow-sm">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={loading === user.id}
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                    >
                      <SelectTrigger className="w-[120px] h-8 bg-background">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3.5 w-3.5" />
                            <span>User</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">{user._count?.conversations || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.preferences ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.preferences.languageName}</span>
                        <span className="text-xs text-muted-foreground">{user.preferences.languageRegion}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.preferences?.voice ? (
                      <Badge variant="outline" className="bg-background">{user.preferences.voice}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(user.id)}
                        >
                          Copy User ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <span>No users found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                account and remove their data (preferences, conversations, messages) from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading === userToDelete ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

