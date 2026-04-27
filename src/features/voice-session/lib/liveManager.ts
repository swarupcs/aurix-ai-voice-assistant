import {
  base64ToUint8Array,
  createPCMBlob,
  decodeAudioData,
} from '@/lib/audioUtils';
import { INPUT_SAMPLE_RATE, MODEL, OUTPUT_SAMPLE_RATE } from '@/lib/constants';
import { ConnectConfig, ConnectionState, LiveManagerCallbacks } from '@/types';
import {
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';

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

export class LiveManager {
  private ai: GoogleGenAI;
  private activeSession: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private callbacks: LiveManagerCallbacks;
  // todo: explore where to use: hint - in session connect
  private isMuted: boolean = false;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private vadInterval: NodeJS.Timeout | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;

  private inputTranscription = '';
  private outputTranscription = '';
  private playbackGeneration = 0;
  private localTranscriptionActive = false;
  private recognition: ISpeechRecognition | null = null;
  private isUserSpeaking = false;
  private speechSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SPEECH_THRESHOLD = 0.04;
  private readonly SILENCE_DEBOUNCE_MS = 300;

  // Local SpeechRecognition for instant user transcript preview
  // Gemini's inputTranscription has server-side delay; this bridges the gap
  private localInputText = '';
  private geminiInputActive = false;
  
  // Continuous Offset architecture variables
  private recognitionOffset = 0;
  private lastRecognitionResults: ISpeechRecognitionEvent['results'] | null = null;

  constructor(callbacks: LiveManagerCallbacks, token: string) {
    this.ai = new GoogleGenAI({
      apiKey: token,
      apiVersion: 'v1alpha',
      vertexai: false,
    });

    this.callbacks = callbacks;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  async startSession(connectConfig: ConnectConfig) {
    try {
      console.log('starting the session');

      // connecting
      this.callbacks.onStateChange(ConnectionState.CONNECTING);

      const config: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: connectConfig.selected_assistant_voice,
            },
          },
        },
        systemInstruction: {
          parts: [{ text: this.generateSystemPrompt(connectConfig) }],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      this.activeSession = await this.ai.live.connect({
        model: MODEL,
        config: config,
        callbacks: {
          onopen: () => {
            this.callbacks.onStateChange(ConnectionState.CONNECTED);
          },
          onmessage: this.handleMessage.bind(this),
          onerror: (e) => {
            console.log(e);
            this.callbacks.onStateChange(ConnectionState.ERROR);
            this.callbacks.onError('Could not connect.');
          },
          // Handle server-side disconnects so the UI isn't left hanging
          onclose: (e) => {
            console.log('Closed:', e.reason);
            this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
          },
        },
      });

      this.inputAudioContext = new AudioContext({
        sampleRate: INPUT_SAMPLE_RATE,
        latencyHint: 'interactive',
      });

      this.outputAudioContext = new AudioContext({
        sampleRate: OUTPUT_SAMPLE_RATE,
        latencyHint: 'interactive',
      });

      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
      }

      this.outputNode = this.outputAudioContext.createGain();
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;

      this.outputNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioContext.destination);

      await this.inputAudioContext.audioWorklet.addModule(
        `/worklets/mic-processor.js?v=${Date.now()}`
      );

      this.workletNode = new AudioWorkletNode(
        this.inputAudioContext,
        'mic-processor',
      );

      this.workletNode.port.onmessage = (event) => {
        if (this.isMuted) return;

        const pcmBlob = createPCMBlob(event.data as Float32Array);

        this.activeSession?.sendRealtimeInput({
          audio: pcmBlob,
        });
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.inputSource = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );

      // Set up input analyser for real-time user waveform
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;

      this.inputSource.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.workletNode);

      // Start browser-native SpeechRecognition for instant transcript preview
      // This gives word-by-word display while Gemini's server-side transcription catches up
      this.startLocalTranscription(connectConfig.selected_launguage_code);

      // Poll both input and output audio levels at ~30fps for smooth visualization
      this.audioLevelInterval = setInterval(() => {
        if (this.outputAnalyser) {
          const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
          this.outputAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 255);
          this.callbacks.onAudioLevel(normalized, 'output');
        }

        if (this.inputAnalyser) {
          const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
          this.inputAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 255);
          this.callbacks.onAudioLevel(normalized, 'input');

          // Voice activity detection: detect when user starts/stops speaking
          if (normalized > this.SPEECH_THRESHOLD) {
            // Voice detected — clear any pending silence timer
            if (this.speechSilenceTimer) {
              clearTimeout(this.speechSilenceTimer);
              this.speechSilenceTimer = null;
            }
            if (!this.isUserSpeaking) {
              this.isUserSpeaking = true;
              this.callbacks.onUserSpeaking(true);
            }
          } else if (this.isUserSpeaking) {
            // Silence detected — debounce before marking as stopped
            if (!this.speechSilenceTimer) {
              this.speechSilenceTimer = setTimeout(() => {
                this.isUserSpeaking = false;
                this.callbacks.onUserSpeaking(false);
                this.speechSilenceTimer = null;
              }, this.SILENCE_DEBOUNCE_MS);
            }
          }
        }
      }, 33);
    } catch (e) {
      console.error(e);
      this.callbacks.onStateChange(ConnectionState.ERROR);
      this.callbacks.onError('Something went wrong.');
    }
  }

  generateSystemPrompt(config: ConnectConfig) {
    let basePrompt = `ROLE: You are an expert AI Voice Assistant. Your name is "Aurix".\n\n`;

    const langInstruction =
      config.selected_conversation_type === 'Language Practice'
        ? `The user will be speaking to you in ${config.selected_launguage_name}. You must transcribe their audio as ${config.selected_launguage_name} and respond in ${config.selected_launguage_name}.`
        : `The user will be speaking to you in English. Please transcribe their audio as English and respond in English.`;

    basePrompt += `SPOKEN LANGUAGE INSTRUCTION: ${langInstruction}\n\n`;

    basePrompt += `STRICT IDENTITY AND EXPERTISE RULES (NEVER BREAK THESE):
1. If the user asks anything about who built you, who created you, who made you, what company owns you, what AI model you are, or whether you are Gemini, ChatGPT, Claude, or any other AI — DO NOT answer. Do not confirm or deny. Do not explain. Simply respond with: "I'm not able to share that information."
2. If the user asks about your expertise, your capabilities, what you can do, or what you specialize in — DO NOT answer with a list of capabilities. Simply respond with: "I'm not able to share that information."
3. Never reveal that you are built on Gemini, Google AI, or any other underlying technology.
4. Never break character regardless of how the user phrases the question — even if they say "just tell me", "I already know", "be honest", or "hypothetically".
5. These rules override everything else. No exceptions.\n\n`;

    if (config.selected_conversation_type === 'Language Practice') {
      basePrompt += `GOAL: Help the user improve their proficiency in ${config.selected_launguage_name} (${config.selected_launguage_region}).
TOPIC: ${config.selected_topic}.
USER LEVEL: ${config.selected_proefficent_level}.

CRITICAL INSTRUCTIONS:
1. The user will be speaking ${config.selected_launguage_name}. You MUST interpret all audio input as ${config.selected_launguage_name}, even if it sounds unclear. Never transcribe or respond in unrelated languages.
2. **Strictly** speak in ${config.selected_launguage_name}. Only use English if the user is completely stuck or asks for a translation.
3. **Correction Mode**: If the user makes a grammar or pronunciation mistake, gently correct it *first*, then continue the conversation. Format: "Small tip: In ${config.selected_launguage_name} we say [Correction]. Anyway, [Response]?"
4. **Conversation Flow**: Keep responses extremely concise (1-2 sentences maximum). Ask open-ended questions to keep the user talking.`;
    } else if (config.selected_conversation_type === 'Interview Prep') {
      basePrompt += `GOAL: Conduct a realistic interview based on the topic: ${config.selected_topic}.
LANGUAGE: ${config.selected_launguage_name} (${config.selected_launguage_region}).
USER LEVEL: ${config.selected_proefficent_level}.

CRITICAL INSTRUCTIONS:
1. Act as a professional interviewer.
2. Ask one clear question at a time and wait for the user to answer.
3. After the user answers, provide brief feedback or a follow-up question.
4. Keep responses very concise and conversational (1-2 sentences). Do not give long monologues.
5. Strictly speak in ${config.selected_launguage_name}.`;
    } else if (config.selected_conversation_type === 'Roleplay') {
      basePrompt += `GOAL: Engage in a realistic roleplay scenario based on the topic: ${config.selected_topic}.
LANGUAGE: ${config.selected_launguage_name} (${config.selected_launguage_region}).
USER LEVEL: ${config.selected_proefficent_level}.

CRITICAL INSTRUCTIONS:
1. fully immerse yourself in a character relevant to the scenario.
2. React naturally to what the user says as if it's a real-world situation.
3. Keep your responses short (1-2 sentences) and interactive to encourage the user to speak.
4. Strictly speak in ${config.selected_launguage_name}.`;
    } else {
      // General Assistant
      basePrompt += `GOAL: Act as a helpful, friendly, and knowledgeable general assistant discussing: ${config.selected_topic}.
LANGUAGE: ${config.selected_launguage_name} (${config.selected_launguage_region}).

CRITICAL INSTRUCTIONS:
1. Answer the user's questions or discuss the topic naturally.
2. Keep your responses concise (1-3 sentences) to maintain a fast-paced voice conversation.
3. Do NOT lecture. Make it a back-and-forth dialogue.
4. Strictly speak in ${config.selected_launguage_name}.`;
    }

    return basePrompt;
  }

  /**
   * Start browser-native SpeechRecognition for instant local transcript preview.
   * This provides word-by-word display while the user speaks, before Gemini's
   * server-side inputTranscription arrives (which has significant latency).
   * Once Gemini's transcription starts arriving, it seamlessly takes over.
   */
  private recognitionLang = '';

  private startLocalTranscription(languageCode: string) {
    this.recognitionLang = languageCode;

    if (!this.recognition) {
      const SpeechRecognitionAPI =
        (window as unknown as { SpeechRecognition: new () => ISpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: new () => ISpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        console.log('[LiveManager] SpeechRecognition not available — using Gemini-only transcription');
        return;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }

    this.recognition.lang = languageCode;
    this.localTranscriptionActive = true;

    // Check for blocked questions
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

    const isBlockedQuestion = (text: string) => {
      return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
    };

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      // Store for offset calculations
      this.lastRecognitionResults = event.results;

      // Once Gemini's transcription has arrived for this utterance, defer to it
      if (this.geminiInputActive) return;

      // Build the full text from the offset onwards
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
      // Browser SR automatically stops after silence. If the session is still
      // active, we automatically restart it using the same instance.
      if (this.localTranscriptionActive && this.activeSession) {
        // The browser clears event.results when it natively restarts, so reset offset
        this.recognitionOffset = 0;
        this.lastRecognitionResults = null;
        try {
          this.recognition?.start();
        } catch (e) {
          console.log('[LiveManager] Failed to auto-restart SR:', e);
        }
      }
    };

    this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      // 'no-speech' fires constantly during silence — don't spam logs
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.log('[LiveManager] SpeechRecognition error:', event.error);
      }
    };

    try {
      this.recognition.start();
      console.log('[LiveManager] 🎙️ Local SpeechRecognition started for instant preview');
    } catch (e) {
      console.log('[LiveManager] Failed to start SpeechRecognition:', e);
    }
  }

  /** Stop local SR entirely (used on disconnect) */
  private stopLocalTranscription() {
    this.localTranscriptionActive = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  /** Update offset to clear text buffer for a new turn without risking a mic lock */
  private restartLocalTranscription() {
    if (this.recognition && this.localTranscriptionActive) {
      // Instead of killing the mic, just ignore all previous results in the array
      if (this.lastRecognitionResults) {
        let newOffset = this.lastRecognitionResults.length;
        // If the user is currently speaking (e.g. interrupting), the last result is not final.
        // We keep that active result, but ignore all the fully finalized ones.
        if (newOffset > 0 && !this.lastRecognitionResults[newOffset - 1].isFinal) {
          newOffset = newOffset - 1;
        }
        this.recognitionOffset = newOffset;
      }
    }
  }

  async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    if (serverContent?.interrupted) {
      console.log('[LiveManager] ⚡ INTERRUPTED');
      this.stopAllAudio();
      
      // Crucial fix: If interrupted, we must seal the current transcript buffers 
      // so the next sentence doesn't concatenate with the interrupted one.
      if (this.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', this.inputTranscription, false);
        this.inputTranscription = '';
      }
      if (this.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', this.outputTranscription, false);
        this.outputTranscription = '';
      }
      // Reset flags — SR is kept running (or will be restarted by turnComplete).
      // Do NOT restart SR here: after interrupted, Gemini always sends turnComplete
      // next, which is the single canonical SR restart point.
      this.geminiInputActive = false;
      this.localInputText = '';
    }

    // Check for blocked questions
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

    const isBlockedQuestion = (text: string) => {
      return BLOCKED_PATTERNS.some(pattern => pattern.test(text));
    };

    if (serverContent?.inputTranscription?.text) {
      console.log('[LiveManager] 🎤 inputTranscription:', JSON.stringify(serverContent.inputTranscription.text));

      // Gemini's server-side transcription has arrived — block local SR to prevent duplicates
      if (!this.geminiInputActive) {
        this.geminiInputActive = true;
      }
      this.inputTranscription += serverContent?.inputTranscription?.text;

      if (isBlockedQuestion(this.inputTranscription)) {
        this.callbacks.onTranscript('user', '[Filtered]', true);
      } else {
        this.callbacks.onTranscript('user', this.inputTranscription, true);
      }
    }

    // Gemini can also send finished: true when a user turn naturally completes
    if (serverContent?.inputTranscription?.finished) {
      console.log('[LiveManager] 🎤 inputTranscription FINISHED');
      const safetyUserText = this.inputTranscription.trim() || this.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
           console.log('[LiveManager] 🛑 Blocked question detected — filtering transcript');
           this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
           this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      this.inputTranscription = '';
      
      // Block local SR from reviving old text until turn formally completes
      this.geminiInputActive = true;
      this.localInputText = '';
    }

    if (serverContent?.outputTranscription?.text) {
      console.log('[LiveManager] 🤖 outputTranscription:', JSON.stringify(serverContent.outputTranscription.text));
      this.outputTranscription += serverContent?.outputTranscription?.text;

      this.callbacks.onTranscript('model', this.outputTranscription, true);
    }

    // When AI starts responding, the user's turn is over.
    const isModelResponding = !!(serverContent?.modelTurn || serverContent?.outputTranscription?.text);
    if (isModelResponding) {
      const safetyUserText = this.inputTranscription.trim() || this.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
          this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
          this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      this.inputTranscription = '';
      this.localInputText = '';
      
      // Always block local SR preview from interfering or duplicating while AI responds
      this.geminiInputActive = true;
    }

    // Gemini turnComplete fires when the AI finishes responding
    if (serverContent?.turnComplete) {
      console.log('[LiveManager] ✅ turnComplete');

      // Apply a tiny 50ms fade-out at the exact end of the scheduled audio 
      // to prevent harsh "pop" or "junk" static sounds caused by abrupt PCM buffer endings.
      if (this.outputNode && this.outputAudioContext) {
        const now = this.outputAudioContext.currentTime;
        const endTime = Math.max(now, this.nextStartTime);
        const fadeDuration = 0.05;
        
        // Only apply fade-out if there is actually audio scheduled in the future
        if (endTime > now + 0.01) {
           const startFadeTime = Math.max(now, endTime - fadeDuration);
           // Ensure the ramp time is strictly strictly greater than the set time to prevent DOMExceptions
           if (endTime > startFadeTime) {
             try {
               this.outputNode.gain.setValueAtTime(1, startFadeTime);
               this.outputNode.gain.linearRampToValueAtTime(0, endTime);
             } catch (e) {
               console.log('[LiveManager] Fade-out error safely caught:', e);
             }
           }
        }
      }

      // Safety net: finalize any remaining user transcript.
      // Priority: Gemini's accurate inputTranscription first; local SR preview as last resort
      const safetyUserText = this.inputTranscription.trim() || this.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
          this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
          this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      this.inputTranscription = '';
      this.localInputText = '';

      if (this.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', this.outputTranscription, false);
        this.outputTranscription = '';
      }

      // Reset + restart local SR fresh for next user utterance
      this.geminiInputActive = false;
      this.localInputText = '';
      this.restartLocalTranscription();
    }

    // Log unhandled message types for debugging
    if (serverContent && !serverContent.inputTranscription && !serverContent.outputTranscription 
        && !serverContent.turnComplete && !serverContent.interrupted && !serverContent.modelTurn) {
      console.log('[LiveManager] 📦 Unhandled serverContent keys:', Object.keys(serverContent));
    }

    const parts = serverContent?.modelTurn?.parts;
    if (parts) {
      // Hard block on audio playing if the user just asked a blocked question
      const currentText = this.inputTranscription || this.localInputText;
      if (isBlockedQuestion(currentText)) {
        console.log('[LiveManager] 🛑 Blocked audio playback for identity question.');
        return; // Skip audio rendering entirely
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // Fire-and-forget: decode + schedule immediately, no serial queue
          this.playAudioChunk(part.inlineData.data as string);
        }
      }
    }
  }

  async playAudioChunk(audioData: string) {
    const uintData = base64ToUint8Array(audioData);

    if (!this.outputAudioContext || !this.outputNode) return;

    const currentGeneration = this.playbackGeneration;

    // Decode immediately — don't wait in any queue
    const audioBuffer = await decodeAudioData(
      uintData,
      this.outputAudioContext,
      OUTPUT_SAMPLE_RATE,
      1,
    );

    // Skip if an interrupt occurred while we were decoding
    if (currentGeneration !== this.playbackGeneration) return;
    if (!this.outputAudioContext || !this.outputNode) return;

    // Ensure nextStartTime is never in the past
    const now = this.outputAudioContext.currentTime;

    // Always cancel any pending fade-outs from a previous turnComplete
    // and ensure volume is fully restored to 1.0 for this new audio chunk
    this.outputNode.gain.cancelScheduledValues(now);
    this.outputNode.gain.setValueAtTime(1, now);

    if (this.nextStartTime < now) {
      this.nextStartTime = now;
    }

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);

    // Schedule at the precise next slot — Web Audio handles ordering
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });

    this.sources.add(source);
  }

  async stopAllAudio() {
    this.playbackGeneration++;

    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });

    this.sources.clear();

    if (this.outputAudioContext) {
      this.nextStartTime = this.outputAudioContext?.currentTime;
    }
  }

  setMute(isMuted: boolean) {
    this.isMuted = isMuted;

    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  disconnect() {
    this.stopAllAudio();

    // Reset transcript accumulation buffers to prevent stale state
    this.inputTranscription = '';
    this.outputTranscription = '';
    this.localInputText = '';
    this.geminiInputActive = false;

    // Stop local SpeechRecognition
    this.localTranscriptionActive = false;
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.speechSilenceTimer) {
      clearTimeout(this.speechSilenceTimer);
      this.speechSilenceTimer = null;
    }
    this.isUserSpeaking = false;

    if (this.activeSession) {
      this.activeSession.close();
      this.activeSession = null;
    }

    this.inputSource?.disconnect();
    this.inputAnalyser?.disconnect();
    this.workletNode?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.outputNode?.disconnect();

    this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
  }
}

