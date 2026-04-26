import {
  AVAILABLE_LANGUAGES,
  AVAILABLE_PROFICIENCY_LEVELS,
  AVAILABLE_TOPICS,
  AVAILABLE_VOICES,
  AVAILABLE_CONVERSATION_TYPES,
} from '@/lib/constants';
import { LiveManager } from '@/features/voice-session/lib/liveManager';
import { ConnectionState, TranscriptItem } from '@/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { saveConversation } from '@/server/actions/transcript';

type AudioStore = {
  conectionState: ConnectionState;
  error: string | null;
  isMuted: boolean;
  liveManagerInstance: LiveManager;
  transcript: TranscriptItem[];
  volume: number;
  inputVolume: number;
  isUserSpeaking: boolean;

  selectedLanguage: string;
  selectedProficiencyLevel: string;
  selectedTopic: string;
  selectedAssistantVoice: string;
  selectedConversationType: string;

  activeTab: 'live' | 'history' | 'analytics';
  liveNotes: string;

  setSelectedLanguage: (lang: string) => void;
  setSelectedProficiencyLevel: (prof: string) => void;
  setSelectedTopic: (topic: string) => void;
  setSelectedAssistantvoice: (voice: string) => void;
  setSelectedConversationType: (type: string) => void;
  setActiveTab: (tab: 'live' | 'history' | 'analytics') => void;
  setLiveNotes: (notes: string) => void;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => void;
  getMediaStream: () => MediaStream | null;
};

export const useAudioStore = create<AudioStore>()(
  devtools((set, get) => ({
    connectionState: ConnectionState.DISCONNECTED,
    liveManagerInstance: null,
    error: null,
    isMuted: false,
    transcript: [],
    volume: 0,
    inputVolume: 0,
    isUserSpeaking: false,

    selectedLanguage: AVAILABLE_LANGUAGES[0].code,
    selectedProficiencyLevel: AVAILABLE_PROFICIENCY_LEVELS[0].label,
    selectedTopic: AVAILABLE_TOPICS[0],
    selectedAssistantVoice: AVAILABLE_VOICES[0].name,
    selectedConversationType: AVAILABLE_CONVERSATION_TYPES[0],

    activeTab: 'live',
    liveNotes: '',

    getMediaStream: () => {
      const state = get();
      if (state.liveManagerInstance) {
        return (state.liveManagerInstance as any).mediaStream || null;
      }
      return null;
    },

    setSelectedLanguage: (lang: string) => {
      set({ selectedLanguage: lang });
    },
    setSelectedProficiencyLevel: (prof: string) => {
      set({ selectedProficiencyLevel: prof });
    },
    setSelectedTopic: (topic: string) => {
      set({ selectedTopic: topic });
    },
    setSelectedAssistantvoice: (voice: string) => {
      set({ selectedAssistantVoice: voice });
    },
    setSelectedConversationType: (type: string) => {
      set({ selectedConversationType: type });
    },
    setActiveTab: (tab: 'live' | 'history' | 'analytics') => {
      set({ activeTab: tab });
    },
    setLiveNotes: (notes: string) => {
      set({ liveNotes: notes });
    },

    toggleMute: () => {
      const state = get();
      const newState = !state.isMuted;
      set({ isMuted: newState });
      state.liveManagerInstance.setMute(newState);
    },
    connect: async () => {
      const state = get();

      // get ephemeral token
      const response = await fetch('/api/token');
      if (!response.ok) {
        set({ error: 'failed to generate token' });

        return;
      }

      const { token } = await response.json();

      if (
        state.conectionState === ConnectionState.CONNECTING ||
        state.conectionState === ConnectionState.CONNECTED
      ) {
        return;
      }

      set({ error: null });

      // check permission
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch {
        set({ error: 'Microphone permission denied' });
      }

      // create live manager (singleton)
      let manager = state.liveManagerInstance;
      if (!manager) {
        manager = new LiveManager(
          {
            onStateChange: (state) => set({ conectionState: state }),
            onError: (err) => set({ error: err }),
            onTranscript: (sender, text, isPartial) => {
              set((state) => {
                if (!text.trim() && !isPartial) {
                  return state; // Ignore completely empty final dispatches
                }

                const transcript = state.transcript;
                const existingIndex = transcript.findLastIndex((item) => {
                  return item.sender === sender && item.isPartial;
                });

                // Update existing partial — only clone the changed item
                if (existingIndex !== -1) {
                  const updated = [...transcript];
                  updated[existingIndex] = {
                    ...transcript[existingIndex],
                    text,
                    isPartial,
                  };
                  return { transcript: updated };
                }

                // New message — append only if non-empty
                if (text.trim()) {
                  return {
                    transcript: [
                      ...transcript,
                      {
                        id: crypto.randomUUID(),
                        sender,
                        text,
                        isPartial,
                      },
                    ],
                  };
                }

                return state;
              });
            },
            // implement this, animate when AI is talking.
            onAudioLevel: (level, type) => {
              if (type === 'output') {
                set({ volume: level });
              } else if (type === 'input') {
                set({ inputVolume: level });
              }
            },
            onUserSpeaking: (isSpeaking) => {
              set({ isUserSpeaking: isSpeaking });
            },
          },
          token.name,
        );

        set({ liveManagerInstance: manager });
      }

      const selectedLang = AVAILABLE_LANGUAGES.find(
        (l) => l.code === state.selectedLanguage,
      );
      // create session
      manager.startSession({
        selected_assistant_voice: state.selectedAssistantVoice,
        selected_launguage_code: selectedLang?.code || 'en-US',
        selected_launguage_name: selectedLang?.name || 'English',
        selected_launguage_region: selectedLang?.region || 'US',
        description: state.selectedTopic,
        selected_topic: state.selectedTopic,
        selected_proefficent_level: state.selectedProficiencyLevel,
        selected_conversation_type: state.selectedConversationType,
      });
    },
    disconnect: async () => {
      const state = get();
      if (state.liveManagerInstance) {
        state.liveManagerInstance.disconnect();

        // Save conversation if there are completed messages
        const completedMessages = state.transcript.filter(m => !m.isPartial && m.text.trim() !== '');
        if (completedMessages.length > 0) {
          const messagesToSave = completedMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          }));
          
          try {
            await saveConversation(state.selectedTopic || "Conversation", messagesToSave);
          } catch (e) {
            console.error("Failed to save conversation:", e);
          }
        }

        set({ liveManagerInstance: undefined });

        set({
          conectionState: ConnectionState.DISCONNECTED,
          transcript: [], // Clear after saving
          isUserSpeaking: false,
        });
      }
    },
  })),
);
