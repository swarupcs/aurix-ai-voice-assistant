'use client';

import {
  Settings2,
  Globe,
  GraduationCap,
  MessageSquare,
  Mic,
  Palette,
  Briefcase,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ModeToggle } from '@/components/shared/mode-toggle';

import {
  AVAILABLE_LANGUAGES,
  AVAILABLE_VOICES,
  AVAILABLE_PROFICIENCY_LEVELS,
  AVAILABLE_TOPICS,
  AVAILABLE_CONVERSATION_TYPES,
} from '@/lib/constants';
import SidebarHeaderComponent from '@/components/shared/sidebar-header';
import { useAudioStore } from '@/features/voice-session/store/useAudioStore';
import { ConnectionState } from '@/types';
import { updateUserPreferences } from '@/server/actions/preferences';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

function LeftSidebar() {
  const {
    selectedLanguage,
    selectedProficiencyLevel,
    selectedAssistantVoice,
    selectedTopic,
    selectedConversationType,
    conectionState,
    setSelectedLanguage,
    setSelectedProficiencyLevel,
    setSelectedAssistantvoice,
    setSelectedTopic,
    setSelectedConversationType,
  } = useAudioStore();

  const disabled = conectionState === ConnectionState.CONNECTED || conectionState === ConnectionState.CONNECTING;

  // Modern input style matching the clean aesthetic
  const triggerClass = cn(
    'h-10 w-full justify-between rounded-lg bg-background/50',
    'text-sm font-medium shadow-sm transition-colors hover:bg-background',
    disabled && 'opacity-50 cursor-not-allowed',
  );

  const handleLanguageChange = async (val: string) => {
    setSelectedLanguage(val);
    const lang = AVAILABLE_LANGUAGES.find((l) => l.code === val);
    if (lang) {
      await updateUserPreferences({ languageRegion: lang.region, languageName: lang.name });
    }
  };

  const handleProficiencyChange = async (val: string) => {
    setSelectedProficiencyLevel(val);
    await updateUserPreferences({ proficiencyLevel: val });
  };

  const handleTopicChange = async (val: string) => {
    setSelectedTopic(val);
    await updateUserPreferences({ topic: val });
  };

  const handleConversationTypeChange = async (val: string) => {
    setSelectedConversationType(val);
    await updateUserPreferences({ conversationType: val });
  };

  const handleVoiceChange = async (val: string) => {
    setSelectedAssistantvoice(val);
    await updateUserPreferences({ voice: val });
  };

  return (
    <Sidebar className="border-none md:bg-transparent bg-background/95 md:p-4 transition-all z-20">
      <div className="flex flex-col h-full w-full bg-background/60 backdrop-blur-3xl md:border border-border/20 md:rounded-[2rem] overflow-hidden md:shadow-2xl ring-1 ring-white/5">
        <SidebarHeader className="border-b border-border/10 p-5 bg-gradient-to-b from-background/50 to-transparent">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Settings2 className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-sm font-bold tracking-tight">Configuration</h2>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Session Settings</p>
             </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-5 py-6 space-y-8 custom-scrollbar">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 px-0">
              <Briefcase className="w-3.5 h-3.5 text-primary/40" /> Type
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Select
                value={selectedConversationType}
                onValueChange={handleConversationTypeChange}
                disabled={disabled}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-white/10 backdrop-blur-xl bg-background/90">
                  {AVAILABLE_CONVERSATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="rounded-lg cursor-pointer my-1">
                      <span className="text-sm font-medium">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 px-0">
              <Globe className="w-3.5 h-3.5 text-primary/40" /> Language
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                disabled={disabled}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-white/10 backdrop-blur-xl bg-background/90">
                  <SelectGroup>
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.code} className="rounded-lg cursor-pointer my-1">
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-sm font-medium truncate">{lang.name}</span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground truncate opacity-80 bg-muted/50 px-2 py-0.5 rounded-md">
                            {lang.region}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-3">
              <GraduationCap className="w-4 h-4 text-primary/70" /> Skill Level
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Select
                value={selectedProficiencyLevel}
                onValueChange={handleProficiencyChange}
                disabled={disabled}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-white/10 backdrop-blur-xl bg-background/90">
                  {AVAILABLE_PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.label} className="rounded-lg cursor-pointer my-1">
                      <span className="text-sm font-medium">{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-3">
              <MessageSquare className="w-4 h-4 text-primary/70" /> Conversation Topic
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Select
                value={selectedTopic}
                onValueChange={handleTopicChange}
                disabled={disabled}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-white/10 backdrop-blur-xl bg-background/90">
                  {AVAILABLE_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic} className="rounded-lg cursor-pointer my-1">
                      <span className="text-sm font-medium">{topic}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-3">
              <Mic className="w-4 h-4 text-primary/70" /> AI Voice Persona
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Select
                value={selectedAssistantVoice}
                onValueChange={handleVoiceChange}
                disabled={disabled}
              >
                <SelectTrigger className={triggerClass}>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-white/10 backdrop-blur-xl bg-background/90">
                  {AVAILABLE_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.name} className="rounded-lg cursor-pointer my-1">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                          {voice.category}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border/10 p-5 bg-background/30 backdrop-blur-md">
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-white/10 shadow-inner">  
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-3">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </div>
            <ModeToggle />
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>  );
}

export default LeftSidebar;
