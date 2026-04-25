'use client';

import { useState } from 'react';
import { Loader2, Mic, MicOff, PhoneOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ConnectionState } from '@/types';
import { Button } from '@/components/ui/button';
import { MicSelector } from '@/components/ui/mic-selector';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';

function ControlsPanel() {
  const connect = useAudioStore((state) => state.connect);
  const disconnect = useAudioStore((state) => state.disconnect);
  const conectionState = useAudioStore((state) => state.conectionState);
  const toggleMute = useAudioStore((state) => state.toggleMute);
  const isMuted = useAudioStore((state) => state.isMuted);

  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const isConnected = conectionState === ConnectionState.CONNECTED;
  const isConnecting = conectionState === ConnectionState.CONNECTING;

  return (
    <div className='w-full max-w-[95vw] sm:max-w-fit mx-auto transition-all duration-500 ease-in-out pb-4'>
      <div
        className={cn(
          'flex items-center justify-between sm:justify-center gap-2 sm:gap-3 p-2 sm:p-2',
          'rounded-[2rem]',
          'border border-white/20 dark:border-white/10',
          'bg-background/40 backdrop-blur-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]',
          'transition-all duration-500 hover:bg-background/50',
        )}
      >
        {/* Mic Selector */}
        <div className='flex-1 sm:flex-none min-w-0 sm:px-3'>
          <MicSelector
            value={selectedDevice}
            onValueChange={setSelectedDevice}
            muted={false}
            onMutedChange={() => {}}
            disabled={isConnecting}
            className='w-full sm:w-56 bg-transparent border-0 hover:bg-white/10 dark:hover:bg-white/5 rounded-full shadow-none focus:ring-0 transition-colors text-foreground'
          />
        </div>

        <div className='hidden sm:block w-[1px] h-8 bg-border/40 mx-1' />

        {/* Action Buttons */}
        <div className='flex items-center gap-2 shrink-0 pr-1'>
          {/* 1. MUTE BUTTON (Visible only when Connected) */}
          {isConnected && (
            <Button
              onClick={toggleMute}
              variant={'secondary'}
              size='icon'
              className={cn(
                'h-12 w-12 rounded-full transition-all duration-300 shadow-md',
                isMuted
                  ? 'bg-destructive/90 text-destructive-foreground hover:bg-destructive scale-95 ring-4 ring-destructive/20'
                  : 'bg-background/80 text-foreground hover:bg-background hover:scale-105 border border-white/10',
              )}
            >
              {isMuted ? (
                <MicOff className='h-5 w-5' />
              ) : (
                <Mic className='h-5 w-5' />
              )}
            </Button>
          )}

          {/* 2. CONNECT / DISCONNECT BUTTON */}
          {!isConnected && !isConnecting ? (
            <Button
              onClick={connect}
              size='lg'
              className={cn(
                'rounded-full',
                'h-12 px-8',
                'bg-gradient-to-r from-primary to-blue-600 text-white font-bold tracking-wide',
                'shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 border border-white/10',
                'transition-all duration-300 active:scale-95',
              )}
            >
              <Mic className='h-5 w-5 mr-2 animate-pulse' />
              <span>Start Session</span>
            </Button>
          ) : (
            <Button
              onClick={disconnect}
              disabled={isConnecting}
              variant='destructive'
              size='lg'
              className={cn(
                'rounded-full',
                'h-12 px-8',
                'bg-gradient-to-r from-destructive/90 to-red-600 text-white font-bold tracking-wide border border-white/10',
                'shadow-lg shadow-destructive/20 hover:shadow-destructive/40 hover:scale-105',
                'transition-all duration-300 active:scale-95',
              )}
            >
              {isConnecting ? (
                <Loader2 className='h-5 w-5 animate-spin mr-2' />
              ) : (
                <PhoneOff className='h-5 w-5 mr-2' />
              )}
              <span>{isConnecting ? 'Connecting...' : 'End Session'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ControlsPanel;
