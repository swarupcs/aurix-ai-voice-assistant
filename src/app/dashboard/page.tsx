import { auth, signOut } from '@/lib/auth';
import { type Session } from 'next-auth';
import { LogOut, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import RightSidebar from "@/features/transcript/components/right-sidebar";
import LeftSidebar from "@/features/dashboard/components/left-sidebar";

import { getUserPreferences } from '@/server/actions/preferences';
import StoreInitializer from '@/features/voice-session/components/store-initializer';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardTabs } from '@/features/dashboard/components/dashboard-tabs';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';

export default async function DashboardPage() {
  const session = await auth();
  const preferences = await getUserPreferences();

  return (
    <SidebarProvider>
      <DashboardContent session={session} preferences={preferences} />
    </SidebarProvider>
  );
}

function DashboardContent({ session, preferences }: { session: Session | null, preferences: Awaited<ReturnType<typeof getUserPreferences>> }) {
  return (
    <div className="h-dvh w-full flex overflow-hidden bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary relative dark:bg-zinc-950 bg-slate-50">

      {/* Immersive Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen opacity-60 animate-pulse duration-10000" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {preferences && <StoreInitializer preferences={preferences} />}

      {/* Left Config Sidebar */}
      <LeftSidebar />

      <SidebarInset className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative z-10 transition-all duration-300">
        {/* Main App Canvas - Floating on desktop */}
        <div className="flex-1 flex flex-col h-full md:py-4 md:pr-4">
          <div className="flex-1 flex flex-col relative rounded-none md:rounded-[2rem] border-x-0 md:border border-white/10 dark:border-white/5 bg-background/50 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 transition-all">

            {/* Floating Header */}
            <header className="px-6 h-16 flex shrink-0 items-center justify-between gap-4 sticky top-0 z-50 bg-gradient-to-b from-background/40 to-transparent">
              <div className="flex items-center gap-3">
                <div className="md:hidden flex items-center">
                  <SidebarTrigger className="-ml-2 text-foreground/70 hover:text-foreground transition-colors" />
                </div>
                <Link className="flex items-center justify-center gap-3 group" href="/dashboard">
                  <div className="bg-gradient-to-br from-primary to-blue-600 p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-foreground group-hover:to-foreground transition-all">Aurix AI</span>
                </Link>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">
                {session?.user && (
                  <div className="hidden lg:flex items-center gap-2 bg-background/60 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                )}
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/' });
                  }}
                >
                  <Button variant="ghost" size="icon" title="Sign Out" className="rounded-full bg-background/40 backdrop-blur-md border border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all h-9 w-9">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign out</span>
                  </Button>
                </form>
              </div>
            </header>

            <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
              {/* Dashboard Tabs Switcher */}
              <div className="mt-4">
                <DashboardTabs />
              </div>

              <DashboardClient />
            </main>
          </div>
        </div>
      </SidebarInset>

      {/* Right Sidebar (Transcript) */}
      <RightSidebar />
    </div>
  );
}
