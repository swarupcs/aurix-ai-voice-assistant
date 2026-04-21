'use client';

import { cn } from '@/lib/utils';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { ConnectionState } from '@/types';
import { AlertCircle } from 'lucide-react';

function StatusPanel() {
  const { conectionState, error } = useAudioStore();

  const isConnected = conectionState === ConnectionState.CONNECTED;
  const isConnecting = conectionState === ConnectionState.CONNECTING;

  return (
    <div className='absolute top-6 left-0 right-0 flex flex-col items-center gap-3 z-20 pointer-events-none'>
      {/* Error Toast */}
      {error && (
        <div className='bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2.5 rounded-full text-sm flex items-center gap-2 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-4 pointer-events-auto'>
          <AlertCircle size={18} /> <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Status Badge */}
      <div
        className={cn(
          'px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest border transition-all duration-500 flex items-center gap-3 backdrop-blur-2xl shadow-xl',
          isConnecting
            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.15)] animate-pulse'
            : isConnected
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.15)]'
              : 'bg-background/40 text-foreground/80 border-white/10 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        )}
      >
        <div
          className={cn(
            'w-2 h-2 rounded-full shadow-sm',
            isConnecting
              ? 'bg-blue-500 shadow-blue-500/50 animate-ping'
              : isConnected
                ? 'bg-emerald-500 shadow-emerald-500/50'
                : 'bg-primary/50 shadow-primary/30',
          )}
        />
        {isConnecting
          ? 'Connecting...'
          : isConnected
            ? 'Live Session Active'
            : 'Ready to Start'}
      </div>
    </div>
  );
}

export default StatusPanel;
