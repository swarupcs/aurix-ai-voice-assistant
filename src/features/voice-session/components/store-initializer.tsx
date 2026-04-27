"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "../store/useAudioStore";
import { TOPICS_BY_TYPE, VOICES_BY_TYPE, AVAILABLE_CONVERSATION_TYPES } from "@/lib/constants";

export default function StoreInitializer({ preferences }: { preferences: Record<string, string | null | undefined> }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (preferences) {
        const store = useAudioStore.getState();
        
        const type = preferences.conversationType || AVAILABLE_CONVERSATION_TYPES[0];
        store.setSelectedConversationType(type);

        const validTopics = TOPICS_BY_TYPE[type] || [];
        const topic = preferences.topic && validTopics.includes(preferences.topic) 
          ? preferences.topic 
          : validTopics[0];
        if (topic) store.setSelectedTopic(topic);

        const validVoices = VOICES_BY_TYPE[type] || [];
        const voice = preferences.voice && validVoices.includes(preferences.voice)
          ? preferences.voice
          : validVoices[0];
        if (voice) store.setSelectedAssistantvoice(voice);

        if (preferences.proficiencyLevel) store.setSelectedProficiencyLevel(preferences.proficiencyLevel);
      }
      initialized.current = true;
    }
  }, [preferences]);

  return null;
}