'use client';

import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { cn } from '@/lib/utils';
import { Mic2, History, BarChart3 } from 'lucide-react';

export function DashboardTabs() {
  const { activeTab, setActiveTab } = useAudioStore();

  const tabs = [
    { id: 'live', label: 'Live Session', icon: Mic2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'AI Analytics', icon: BarChart3 },
  ] as const;

  return (
    <div className="flex items-center justify-center w-full mb-6 px-4">
      <div className="flex p-1.5 bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl ring-1 ring-black/5 max-w-md w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden",
                isActive 
                  ? "text-primary-foreground bg-primary shadow-lg shadow-primary/25 scale-[1.02] z-10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-300", isActive && "scale-110")} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
