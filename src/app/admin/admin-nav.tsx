"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings } from "lucide-react";
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
          <Users className="mr-2 h-4 w-4" />
          Users
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
