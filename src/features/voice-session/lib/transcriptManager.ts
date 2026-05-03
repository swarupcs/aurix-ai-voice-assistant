import { Session } from '@google/genai';

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

// Reused filter logic for transcript manager
const BLOCKED_PATTERNS = [
  /who\s+(built|made|created)\s+you/i,
  /who\s+are\s+you/i,
  /what\s+(are|is)\s+your\s+(name|expertise|capabilities|specialty)/i,
  /what\s+can\s+you\s+do/i,
  /tell\s+me\s+about\s+yourself/i,
  /are\s+you\s+(an\s+ai|a\s+bot|chatgpt|gemini|claude|openai|google)/i,
  /what\s+(ai|model|llm)\s+are\s+you/i,
  /which\s+company/i,
  /who\s+developed\s+you/i,
  /what\s+(powers|runs)\s+you/i,
];

export const isBlockedQuestion = (text: string) => {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
};

export class TranscriptManager {
  private recognition: ISpeechRecognition | null = null;
  public localTranscriptionActive = false;
  private recognitionLang = '';
  private recognitionOffset = 0;
  private lastRecognitionResults: ISpeechRecognitionEvent['results'] | null = null;
  
  public inputTranscription = '';
  public outputTranscription = '';
  public localInputText = '';
  public geminiInputActive = false;
  public activeSession: Session | null = null;

  constructor(private callbacks: { onTranscript: (sender: 'user'|'model', text: string, isPartial: boolean) => void }) {}

  public startLocalTranscription(languageCode: string, activeSession: Session | null) {
    this.recognitionLang = languageCode;

    if (!this.recognition) {
      const SpeechRecognitionAPI =
        (window as unknown as { SpeechRecognition: new () => ISpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: new () => ISpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        console.log('[TranscriptManager] SpeechRecognition not available — using Gemini-only transcription');
        return;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }

    this.recognition.lang = languageCode;
    this.localTranscriptionActive = true;

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      this.lastRecognitionResults = event.results;

      if (this.geminiInputActive) return;

      let text = '';
      for (let i = this.recognitionOffset; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (text && !text.endsWith(' ') && chunk && !chunk.startsWith(' ')) {
          text += ' ' + chunk;
        } else {
          text += chunk;
        }
      }

      if (text.trim()) {
        this.localInputText = text;
        if (isBlockedQuestion(this.localInputText)) {
          this.callbacks.onTranscript('user', '[Filtered]', true);
        } else {
          this.callbacks.onTranscript('user', this.localInputText, true);
        }
      }
    };

    this.recognition.onend = () => {
      if (this.localTranscriptionActive && this.activeSession) {
        this.recognitionOffset = 0;
        this.lastRecognitionResults = null;
        try {
          this.recognition?.start();
        } catch (e) {
          console.log('[TranscriptManager] Failed to auto-restart SR:', e);
        }
      }
    };

    this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.log('[TranscriptManager] SpeechRecognition error:', event.error);
      }
    };

    try {
      this.recognition.start();
      console.log('[TranscriptManager] 🎙️ Local SpeechRecognition started for instant preview');
    } catch (e) {
      console.log('[TranscriptManager] Failed to start SpeechRecognition:', e);
    }
  }

  public restartLocalTranscription() {
    if (this.recognition && this.localTranscriptionActive) {
      if (this.lastRecognitionResults) {
        let newOffset = this.lastRecognitionResults.length;
        if (newOffset > 0 && !this.lastRecognitionResults[newOffset - 1].isFinal) {
          newOffset = newOffset - 1;
        }
        this.recognitionOffset = newOffset;
      }
    }
  }

  public stopLocalTranscription() {
    this.localTranscriptionActive = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  public resetState() {
    this.inputTranscription = '';
    this.outputTranscription = '';
    this.localInputText = '';
    this.geminiInputActive = false;
    this.stopLocalTranscription();
  }
}
