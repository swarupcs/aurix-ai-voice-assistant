import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNav } from "./admin-nav";
import { ModeToggle } from "@/components/shared/mode-toggle";

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
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 text-foreground overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Immersive Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Sidebar */}
      <aside className="w-72 border-r border-border/40 bg-background/50 backdrop-blur-2xl flex flex-col relative z-10 shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-border/40 bg-gradient-to-b from-background/80 to-transparent">
          <Link className="flex items-center gap-3 group" href="/dashboard">
            <div className="bg-gradient-to-br from-primary to-blue-600 p-2.5 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-foreground group-hover:to-foreground transition-all">
                Aurix AI
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Admin Panel</span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <AdminNav />
        </div>

        <div className="p-4 border-t border-border/40 bg-background/30 backdrop-blur-md space-y-2">
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground border-border/50 hover:bg-background/80 backdrop-blur-md shadow-sm h-11 rounded-xl">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center px-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Theme</span>
            <ModeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-border/40 bg-background/50 backdrop-blur-2xl shrink-0 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Admin Console</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-background/80 px-4 py-2 rounded-2xl border border-border/50 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-foreground">
                  {session.user.name || session.user.email?.split('@')[0]}
                </span>
              </div>
              <div className="h-4 w-px bg-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">Admin</span>
            </div>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="icon" title="Sign Out" className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
