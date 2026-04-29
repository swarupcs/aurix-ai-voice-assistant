"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, LayoutDashboard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin">
        <Button 
          variant={pathname === "/admin" ? "secondary" : "ghost"} 
          className={`w-full justify-start ${pathname !== "/admin" ? "text-muted-foreground hover:text-foreground" : ""}`}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/admin/users">
        <Button 
          variant={pathname === "/admin/users" ? "secondary" : "ghost"} 
          className={`w-full justify-start ${pathname !== "/admin/users" ? "text-muted-foreground hover:text-foreground" : ""}`}
        >
          <Users className="mr-2 h-4 w-4" />
          Users
        </Button>
      </Link>
      <Link href="/admin/conversations">
        <Button 
          variant={pathname.startsWith("/admin/conversations") ? "secondary" : "ghost"} 
          className={`w-full justify-start ${!pathname.startsWith("/admin/conversations") ? "text-muted-foreground hover:text-foreground" : ""}`}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Conversations
        </Button>
      </Link>
      <Link href="/admin/settings">
        <Button 
          variant={pathname === "/admin/settings" ? "secondary" : "ghost"} 
          className={`w-full justify-start ${pathname !== "/admin/settings" ? "text-muted-foreground hover:text-foreground" : ""}`}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </nav>
  );
}

