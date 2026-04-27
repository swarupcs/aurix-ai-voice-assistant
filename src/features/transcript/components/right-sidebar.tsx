'use client';
import { LucideLanguages, Mic } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ui/conversation';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message';

import { cleanText } from '@/lib/utils';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { ConnectionState, TranscriptItem } from '@/types';

// Memoized individual message — only re-renders when its own props change
const TranscriptMessage = memo(function TranscriptMessage({
  message,
}: {
  message: TranscriptItem;
}) {
  const cleanedText = cleanText(message.text);
  if (!cleanedText && !message.isPartial) return null;

  const isUser = message.sender === 'user';

  return (
    <Message
      from={isUser ? 'user' : 'assistant'}
      className="py-1 animate-in slide-in-from-bottom-3 fade-in zoom-in-95 duration-300 ease-out"
    >
      {!isUser && (
        <MessageAvatar src='/logo.png' name='Aurix' className="ring-2 ring-primary/20 shadow-md shrink-0 mb-1" />
      )}
      
      <MessageContent
        variant="contained"
        className={`
          shadow-md hover:shadow-lg transition-all rounded-3xl relative backdrop-blur-md px-4 py-2.5 leading-relaxed tracking-wide
          ${!isUser 
            ? 'rounded-tl-md border border-primary/30 bg-gradient-to-br from-primary/90 to-primary/80 text-primary-foreground hover:from-primary hover:to-primary/90' 
            : 'rounded-tr-md border border-white/10 bg-gradient-to-br from-muted/90 to-muted/70 hover:from-muted hover:to-muted/80'
          }
        `}
      >
        {cleanedText}
        {message.isPartial && (
          <span className='ml-1.5 inline-flex items-center gap-0.5 align-baseline h-3 opacity-60'>
            <span className='w-1 h-1 rounded-full bg-current animate-bounce' style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
            <span className='w-1 h-1 rounded-full bg-current animate-bounce' style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
            <span className='w-1 h-1 rounded-full bg-current animate-bounce' style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
          </span>
        )}
      </MessageContent>
    </Message>
  );
});

// Live "Listening..." indicator shown when mic detects voice but transcription hasn't arrived yet
function ListeningIndicator() {
  const inputVolume = useAudioStore((state) => state.inputVolume);
  // Scale the pulsing bars based on actual mic volume
  const barScale = 0.3 + Math.min(1, inputVolume * 6) * 0.7;
  const [now, setNow] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-1 animate-in slide-in-from-bottom-3 fade-in duration-200 ease-out">
      <Message from="user">
        <MessageContent
          variant="contained"
          className="rounded-3xl rounded-tr-md border border-white/10 bg-gradient-to-br from-muted/90 to-muted/70 shadow-md backdrop-blur-md px-4 py-2.5"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mic className="w-3.5 h-3.5 animate-pulse text-primary" />
            <span className="text-sm font-medium tracking-wide">Listening</span>
            <span className="inline-flex items-end gap-[2px] h-4 ml-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-[3px] bg-primary/70 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(4, barScale * (8 + Math.sin(now / 200 + i * 1.2) * 6))}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </span>
          </div>
        </MessageContent>
      </Message>
    </div>
  );
}

function RightSidebar() {
  const items = useAudioStore((state) => state.transcript);
  const isUserSpeaking = useAudioStore((state) => state.isUserSpeaking);
  const conectionState = useAudioStore((state) => state.conectionState);

  const isConnected = conectionState === ConnectionState.CONNECTED;

  // Show listening indicator when:
  // 1. Connected and user is speaking
  // 2. There's no existing partial user transcript (Gemini hasn't sent text yet)
  const hasActiveUserPartial = items.some(
    (item) => item.sender === 'user' && item.isPartial
  );
  const showListeningIndicator = isConnected && isUserSpeaking && !hasActiveUserPartial;

  return (
    <aside className='hidden lg:flex flex-col h-full flex-none w-80 lg:w-96 md:py-4 md:pr-4 transition-all z-20'>
      <div className="flex flex-col h-full w-full bg-background/60 backdrop-blur-3xl md:border border-border/20 md:rounded-[2rem] overflow-hidden md:shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className='border-b border-border/10 p-3 flex gap-2 bg-gradient-to-b from-background/50 to-transparent'>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <LucideLanguages className="w-3.5 h-3.5" />
            Transcript
          </div>
        </div>

        {/* Transcript Content */}
        <div className='relative flex-1 overflow-hidden bg-background/30'>
          <Conversation className='h-full overflow-y-auto px-5 py-6 custom-scrollbar'>
            <ConversationContent className='space-y-5'>
              {items.length === 0 && !showListeningIndicator ? (
                <div className='flex h-full flex-col items-center justify-center opacity-70 pt-20 animate-in fade-in zoom-in-95 duration-700'>
                  <div className="bg-primary/10 p-5 rounded-3xl mb-5 shadow-inner ring-1 ring-primary/20">
                    <LucideLanguages className="w-8 h-8 text-primary" />
                  </div>
                  <ConversationEmptyState
                    title=''
                    description='Waiting for you to speak...'
                    className='text-center text-sm font-medium tracking-wide text-muted-foreground'
                  />
                </div>
              ) : (
                <>
                  {items.map((message) => (
                    <TranscriptMessage
                      key={message.id}
                      message={message}
                    />
                  ))}
                  {showListeningIndicator && <ListeningIndicator />}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
