'use client';

import { Mic2 } from 'lucide-react';

export function DashboardTabs() {
  return (
    <div className="flex items-center justify-center w-full mb-6 px-4">
      <div className="flex p-1.5 bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl ring-1 ring-black/5 max-w-md w-full">
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25">
          <Mic2 className="h-4 w-4 scale-110" />
          <span className="hidden sm:inline">Live Session</span>
        </div>
      </div>
    </div>
  );
}
