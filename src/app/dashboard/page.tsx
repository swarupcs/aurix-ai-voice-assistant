import { auth } from '@/lib/auth';
import { type Session } from 'next-auth';
import { MessageSquareText } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import Image from 'next/image';

import RightSidebar from "@/features/transcript/components/right-sidebar";
import LeftSidebar from "@/features/dashboard/components/left-sidebar";

import { getUserPreferences } from '@/server/actions/preferences';
import StoreInitializer from '@/features/voice-session/components/store-initializer';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardTabs } from '@/features/dashboard/components/dashboard-tabs';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';
import { UserMenu } from '@/components/shared/user-menu';

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
                  <div className="bg-primary/20 p-1.5 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                    <Image src="/logo.png" alt="Aurix AI Logo" width={24} height={24} className="object-contain" />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-foreground group-hover:to-foreground transition-all">Aurix AI</span>
                </Link>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Mobile Transcript Trigger */}
                <div className="lg:hidden flex items-center">
                  <Sheet>
                    <SheetTrigger className="inline-flex items-center justify-center rounded-full bg-background/40 backdrop-blur-md border border-white/5 hover:bg-primary/10 hover:text-primary transition-all h-9 w-9 md:h-10 md:w-10 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <MessageSquareText className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="sr-only">Open Transcript</span>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-[85vw] sm:w-96 border-l-0 bg-transparent shadow-none">
                      <SheetTitle className="sr-only">Transcript</SheetTitle>
                      <SheetDescription className="sr-only">Real-time conversation transcript</SheetDescription>
                      <RightSidebar isMobile={true} />
                    </SheetContent>
                  </Sheet>
                </div>

                {session?.user && (
                  <UserMenu user={session.user} />
                )}
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
