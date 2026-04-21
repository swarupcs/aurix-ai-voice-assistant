'use client';

import Image from 'next/image';
import { Orb } from '@/components/ui/orb';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { ConnectionState } from '@/types';
import { cn } from '@/lib/utils';

function VisualizationPanel() {
  const { conectionState, volume } = useAudioStore();
  
  const isConnected = conectionState === ConnectionState.CONNECTED;
  const isConnecting = conectionState === ConnectionState.CONNECTING;
  
  const agentState = volume > 0.01 ? 'talking' : 'listening';

  // Logic to pulsate the logo based on output volume
  const activeScale = 1 + (volume || 0) * 0.4;
  const logoScale = isConnected && agentState === 'talking' ? activeScale : 1;

  return (
    <div className='relative z-10 flex flex-col items-center justify-center w-full max-w-3xl -mt-10'>
      {/* Background ambient glow reacting to volume */}
      <div 
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-300",
          isConnected ? "bg-primary/40" : "bg-muted/30",
          isConnecting && "bg-blue-500/20 animate-pulse"
        )}
        style={{
          transform: `translate(-50%, -50%) scale(${logoScale * 1.2})`,
        }}
      />

      <div className='relative w-72 h-72 sm:w-[450px] sm:h-[450px] flex items-center justify-center'>
        {/* The Orb Background */}
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <Orb
            colors={['var(--primary)', 'var(--chart-4)']}
            agentState={isConnected ? agentState : 'thinking'}
            volumeMode='manual'
            manualInput={isConnected ? 1 : 0}
            manualOutput={isConnected ? 1 : 0}
          />
        </div>

        {/* The Center Logo */}
        <div className='absolute inset-0 z-20 flex items-center justify-center pointer-events-none'>
          <div
            className={cn(
              'relative w-28 h-28 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-2xl transition-all duration-300 ease-out will-change-transform bg-background/20 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center',
              isConnected && agentState === 'talking' ? 'ring-4 ring-primary/30 shadow-[0_0_60px_rgba(var(--primary),0.5)]' : 'ring-1 ring-border/20 shadow-[0_0_30px_rgba(0,0,0,0.1)]'
            )}
            style={{
              transform: `scale(${logoScale})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent mix-blend-overlay" />
            <Image
              height={500}
              width={500}
              src='/logo.png'
              alt='Agent Logo'
              className='w-[80%] h-[80%] object-contain drop-shadow-md'
              priority
            />
          </div>
        </div>
      </div>

      <div className='h-24 w-full max-w-xs sm:max-w-md flex items-center justify-center mt-4 opacity-90 z-10'>
        <LiveWaveform
          active={isConnected}
          processing={isConnecting}
          mode='static'
          barColor={'var(--primary)'}
          barWidth={4}
          barGap={6}
          height={60}
          fadeEdges={true}
        />
      </div>
    </div>
  );
}

export default VisualizationPanel;
