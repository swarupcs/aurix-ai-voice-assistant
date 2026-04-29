import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background/50 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link className="flex items-center gap-3 group" href="/dashboard">
            <div className="bg-gradient-to-br from-primary to-blue-600 p-2 rounded-xl shadow-lg shadow-primary/20">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Aurix AI Admin
            </span>
          </Link>
        </div>
        
        <AdminNav />

        <div className="p-4 border-t">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Home className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b bg-background/50 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-background/60 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                {session.user.email} (Admin)
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="icon" title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
