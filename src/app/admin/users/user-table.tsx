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
import { MoreHorizontal, Trash2, Shield, User as UserIcon, Search, ShieldAlert } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users by name or email..."
            className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          Showing <span className="text-foreground">{filteredUsers.length}</span> {filteredUsers.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-white/10">
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Language</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground">Voice</TableHead>
                <TableHead className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors border-white/10">
                  <TableCell>
                    <div className="flex items-center gap-4 py-2">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name?.charAt(0) || user.email?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{user.name || "Unknown User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={loading === user.id}
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                    >
                      <SelectTrigger className={`w-[130px] h-9 bg-background/50 border-white/10 rounded-lg ${user.role === 'ADMIN' ? 'text-primary ring-1 ring-primary/20' : ''}`}>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 shadow-xl backdrop-blur-xl bg-background/95">
                        <SelectItem value="USER" className="py-2 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">User</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN" className="py-2 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary">Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono bg-secondary/50 border-white/5">{user._count?.conversations || 0} chats</Badge>
                  </TableCell>
                  <TableCell>
                    {user.preferences ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.preferences.languageName}</span>
                        <span className="text-xs text-muted-foreground opacity-80">{user.preferences.languageRegion}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic bg-muted px-2 py-1 rounded-md">Not configured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.preferences?.voice ? (
                      <Badge variant="outline" className="bg-background/50 border-white/10">{user.preferences.voice}</Badge>
                    ) : (
                      <span className="text-muted-foreground font-bold">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-muted">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 shadow-xl backdrop-blur-xl bg-background/95 p-2">
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg mt-1"
                          onClick={() => navigator.clipboard.writeText(user.id)}
                        >
                          Copy User ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span className="font-medium">Delete Account</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-muted/50">
                         <Search className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">No users found matching your search.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                 <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Delete User Account</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This action is permanent and irreversible. All associated data, including preferences and conversation history, will be destroyed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-3">
              <AlertDialogCancel className="rounded-xl h-11 border-white/10 bg-background/50 hover:bg-background">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="rounded-xl h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
              >
                {loading === userToDelete ? "Deleting..." : "Confirm Deletion"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

