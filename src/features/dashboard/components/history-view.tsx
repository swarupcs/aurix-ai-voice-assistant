'use client';

import { Card, CardContent, History, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HistoryView() {
  // Placeholder data - in a real app, this would be fetched from Prisma
  const recentSessions = [
    { id: '1', topic: 'Casual Conversation', language: 'English', date: 'Oct 24, 2026', duration: '12m' },
    { id: '2', topic: 'Job Interview Prep', language: 'Spanish', date: 'Oct 23, 2026', duration: '45m' },
    { id: '3', topic: 'Ordering at a Restaurant', language: 'French', date: 'Oct 21, 2026', duration: '8m' },
  ];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Session History</h2>
          <p className="text-muted-foreground text-sm">Review your past conversations and progress.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {recentSessions.map((session) => (
          <div 
            key={session.id}
            className="group flex items-center justify-between p-5 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 hover:bg-white/5 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 opacity-70" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{session.topic}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {session.language}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.duration}</span>
                  <span>{session.date}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 text-center space-y-4">
          <p className="text-sm font-bold text-primary uppercase tracking-widest">Growth Tracking</p>
          <h3 className="text-xl font-bold">You&apos;ve completed 14 sessions this month!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Consistency is key to mastering a new language. You&apos;re in the top 5% of active learners.</p>
          <Button className="rounded-full shadow-lg shadow-primary/20 mt-2">View Full Progress</Button>
      </div>
    </div>
  );
}

// Minimal icons for internal use
function Globe({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
}
