'use client';
import { LucideLanguages, StickyNote } from 'lucide-react';
import { useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ui/conversation';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message';

import { cleanText } from '@/lib/utils';
import SidebarHeader from '@/components/shared/sidebar-header';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

function RightSidebar() {
  const items = useAudioStore((state) => state.transcript);
  const liveNotes = useAudioStore((state) => state.liveNotes);
  const setLiveNotes = useAudioStore((state) => state.setLiveNotes);
  const [sidebarTab, setSidebarTab] = useState<'transcript' | 'notes'>('transcript');
  return (
    <aside className='hidden lg:flex flex-col h-full flex-none w-80 lg:w-96 md:py-4 md:pr-4 transition-all z-20'>
      <div className="flex flex-col h-full w-full bg-background/60 backdrop-blur-3xl md:border border-border/20 md:rounded-[2rem] overflow-hidden md:shadow-2xl ring-1 ring-white/5">
        {/* Header Tabs */}
        <div className='border-b border-border/10 p-3 flex gap-2 bg-gradient-to-b from-background/50 to-transparent'>
          <button
            onClick={() => setSidebarTab('transcript')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300",
              sidebarTab === 'transcript' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <LucideLanguages className="w-3.5 h-3.5" />
            Transcript
          </button>
          <button
            onClick={() => setSidebarTab('notes')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300",
              sidebarTab === 'notes' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Live Notes
          </button>
        </div>

        {/* Content */}
        <div className='relative flex-1 overflow-hidden bg-background/30'>
          {sidebarTab === 'transcript' ? (
            <Conversation className='h-full overflow-y-auto px-5 py-6 custom-scrollbar'>
              <ConversationContent className='space-y-5'>
                {items.length === 0 ? (
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
                  items.map((message: { id?: string; text: string; isPartial?: boolean; sender: 'user' | 'model' }, i: number) => {
                    const cleanedText = cleanText(message.text);
                    if (!cleanedText && !message.isPartial) return null;
                    const isUser = message.sender === 'user';
                    return (
                      <Message
                        key={message.id || i}
                        from={isUser ? 'user' : 'assistant'}
                        className="py-1 animate-in slide-in-from-bottom-3 fade-in zoom-in-95 duration-500 ease-out"
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
                          {message.isPartial && !isUser && (
                            <span className='ml-3 inline-flex items-center gap-1 align-baseline h-3'>
                              <span className='w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce' style={{ animationDelay: '0ms' }} />
                              <span className='w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce' style={{ animationDelay: '150ms' }} />
                              <span className='w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-bounce' style={{ animationDelay: '300ms' }} />
                            </span>
                          )}
                        </MessageContent>
                      </Message>
                    );
                  })
                )}
              </ConversationContent>
            </Conversation>
          ) : (
            <div className="flex flex-col h-full p-6 animate-in fade-in duration-500">
               <div className="flex items-center gap-2 mb-4 text-primary">
                  <StickyNote className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-widest">Study Notes</span>
               </div>
               <Textarea 
                value={liveNotes}
                onChange={(e) => setLiveNotes(e.target.value)}
                placeholder="Type here to capture grammar tips, new vocabulary, or reminders during your session..."
                className="flex-1 bg-white/5 border-white/10 rounded-2xl p-4 text-sm leading-relaxed resize-none focus:ring-primary/20 focus:border-primary/30 placeholder:text-muted-foreground/50 transition-all custom-scrollbar shadow-inner"
               />
               <p className="mt-4 text-[10px] text-muted-foreground font-medium text-center">Your notes are automatically saved with this session.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
