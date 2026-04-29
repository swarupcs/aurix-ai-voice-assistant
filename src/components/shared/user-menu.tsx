"use client";

import Link from "next/link";
import { LogOut, Shield, User } from "lucide-react";
import { type Session } from "next-auth";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  user: Session["user"];
}

export function UserMenu({ user }: UserMenuProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 shadow-sm overflow-hidden bg-background/40 backdrop-blur-md hover:ring-2 ring-primary/20 transition-all">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 mt-2 border-white/10 shadow-2xl bg-background/95 backdrop-blur-xl rounded-2xl p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40 mb-2" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-3 rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors" asChild>
            <Link href="/profile" className="flex items-center w-full">
              <User className="mr-3 h-4 w-4" />
              <span>Profile Details</span>
            </Link>
          </DropdownMenuItem>
          {user.role === "ADMIN" && (
            <DropdownMenuItem className="p-3 rounded-xl cursor-pointer text-blue-500 hover:bg-blue-500/10 hover:text-blue-500 focus:bg-blue-500/10 focus:text-blue-500 transition-colors" asChild>
              <Link href="/admin" className="flex items-center w-full">
                <Shield className="mr-3 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border/40 my-2" />
        <DropdownMenuItem 
          className="p-3 rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" 
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
