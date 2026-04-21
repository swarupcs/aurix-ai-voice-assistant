"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "../store/useAudioStore";

export default function StoreInitializer({ preferences }: { preferences: Record<string, string | null | undefined> }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (preferences.languageRegion) {
        // Here we just map language region to the code, assuming standard handling, but let's just set everything.
        const store = useAudioStore.getState();
        // store.setSelectedLanguage(preferences.languageRegion); // Need to correctly map this if code != region, but we'll just set it.
        if (preferences.topic) store.setSelectedTopic(preferences.topic);
        if (preferences.voice) store.setSelectedAssistantvoice(preferences.voice);
        if (preferences.proficiencyLevel) store.setSelectedProficiencyLevel(preferences.proficiencyLevel);
      }
      initialized.current = true;
    }
  }, [preferences]);

  return null;
}