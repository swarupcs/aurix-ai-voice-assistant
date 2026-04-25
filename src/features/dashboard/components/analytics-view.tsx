'use client';

import { BarChart3, TrendingUp, Award, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalyticsView() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
          <p className="text-muted-foreground text-sm">Deep analysis of your linguistic performance and vocabulary.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grammar Accuracy</span>
           </div>
           <div className="flex items-end gap-2">
              <span className="text-4xl font-black">92%</span>
              <span className="text-emerald-500 text-sm font-bold mb-1">+4% vs last week</span>
           </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Vocabulary Range</span>
           </div>
           <div className="flex items-end gap-2">
              <span className="text-4xl font-black">B2</span>
              <span className="text-primary text-sm font-bold mb-1">Upper Intermediate</span>
           </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fluency Score</span>
           </div>
           <div className="flex items-end gap-2">
              <span className="text-4xl font-black">8.4</span>
              <span className="text-muted-foreground text-sm font-medium mb-1">out of 10</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
               <Award className="h-5 w-5 text-yellow-500" />
               Key Strengths
            </h3>
            <ul className="space-y-4">
               <li className="flex gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                     <p className="font-bold">Natural Intonation</p>
                     <p className="text-sm text-muted-foreground">Your sentence stress patterns are very close to native speakers.</p>
                  </div>
               </li>
               <li className="flex gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                     <p className="font-bold">Complex Tense Usage</p>
                     <p className="text-sm text-muted-foreground">You correctly used the conditional perfect 3 times in your last session.</p>
                  </div>
               </li>
            </ul>
         </div>

         <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 space-y-6">
            <h3 className="text-xl font-bold">Areas for Improvement</h3>
            <div className="space-y-5">
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="font-medium text-zinc-400">Prepositions of Place</span>
                     <span className="font-bold text-primary">60%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[60%]" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="font-medium text-zinc-400">Subjunctive Mood</span>
                     <span className="font-bold text-primary">45%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-[45%]" />
                  </div>
               </div>
            </div>
            <p className="text-sm text-muted-foreground italic">Aurix will prioritize these topics in your next live session.</p>
         </div>
      </div>
    </div>
  );
}
