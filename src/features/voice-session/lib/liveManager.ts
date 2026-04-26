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
  private recognition: any = null;
  private isUserSpeaking = false;
  private speechSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SPEECH_THRESHOLD = 0.04;
  private readonly SILENCE_DEBOUNCE_MS = 300;

  // Local SpeechRecognition for instant user transcript preview
  // Gemini's inputTranscription has server-side delay; this bridges the gap
  private localInputText = '';
  private geminiInputActive = false;

  constructor(callbacks: LiveManagerCallbacks, token: string) {
    this.ai = new GoogleGenAI({
      apiKey: token,
      apiVersion: 'v1alpha',
      vertexai: false,
    });

    this.callbacks = callbacks;
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
        systemInstruction: this.generateSystemPrompt(connectConfig),
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
          // todo: handle this -> destroy strems, ...
          onclose: (e) => console.log('Closed:', e.reason),
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
    return `
    ROLE: You are an expert language tutor, Your name is "Aurix".

    GOAL: Help the user improve their proficiency in ${config.selected_launguage_name} (${config.selected_launguage_region}).
    TOPIC: ${config.selected_topic}.
    USER LEVEL: ${config.selected_proefficent_level}.

    CRITICAL INSTRUCTIONS:
    1. The user will be speaking ${config.selected_launguage_name}. You MUST interpret all audio input as ${config.selected_launguage_name}, even if it sounds unclear. Never transcribe or respond in Telugu, Kannada, or other unrelated languages.
    2. **Strictly** speak in ${config.selected_launguage_name}. Only use English if the user is completely stuck or asks for a translation.
    3. **Correction Mode**: If the user makes a grammar or pronunciation mistake, gently correct it *first*, then continue the conversation. Format: "Small tip: In ${config.selected_launguage_name} we say [Correction]. Anyway, [Response]?"
    4. **Conversation Flow**: Keep responses extremely concise (1-2 sentences maximum). Ask open-ended questions to keep the user talking.
    `;
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

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.log('[LiveManager] SpeechRecognition not available — using Gemini-only transcription');
      return;
    }

    // Stop any existing instance first
    this.stopLocalTranscription();

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = languageCode;
    this.localTranscriptionActive = true;

    this.recognition.onresult = (event: any) => {
      // Once Gemini's transcription has arrived for this utterance, defer to it
      if (this.geminiInputActive) return;

      // Build the full text from all current results (final + interim)
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      if (text.trim()) {
        this.localInputText = text;
        // Show local preview immediately — user sees words as they speak
        this.callbacks.onTranscript('user', this.localInputText, true);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if session is still active (SR stops after silence periods)
      if (this.localTranscriptionActive && this.activeSession && !this.geminiInputActive) {
        try {
          this.recognition?.start();
        } catch {}
      }
    };

    this.recognition.onerror = (event: any) => {
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

  /** Stop local SR — call when Gemini takes over transcription */
  private stopLocalTranscription() {
    if (this.recognition) {
      try {
        this.recognition.onend = null; // Prevent auto-restart
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  /** Restart local SR fresh — call when a turn completes so next utterance gets instant preview */
  private restartLocalTranscription() {
    if (this.recognitionLang && this.activeSession) {
      this.startLocalTranscription(this.recognitionLang);
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
      // Reset local preview + restart SR fresh for next utterance
      this.geminiInputActive = false;
      this.localInputText = '';
      this.restartLocalTranscription();
    }

    if (serverContent?.inputTranscription?.text) {
      console.log('[LiveManager] 🎤 inputTranscription:', JSON.stringify(serverContent.inputTranscription.text));

      // Gemini's server-side transcription has arrived — stop local SR to prevent duplicates
      if (!this.geminiInputActive) {
        this.geminiInputActive = true;
        this.stopLocalTranscription();
      }
      this.inputTranscription += serverContent?.inputTranscription?.text;

      this.callbacks.onTranscript('user', this.inputTranscription, true);
    }

    // Gemini can also send finished: true when a user turn naturally completes
    if (serverContent?.inputTranscription?.finished) {
      console.log('[LiveManager] 🎤 inputTranscription FINISHED');
      if (this.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', this.inputTranscription, false);
        this.inputTranscription = '';
      }
      // Reset + restart local SR fresh for next utterance
      this.geminiInputActive = false;
      this.localInputText = '';
      this.restartLocalTranscription();
    }

    if (serverContent?.outputTranscription?.text) {
      console.log('[LiveManager] 🤖 outputTranscription:', JSON.stringify(serverContent.outputTranscription.text));
      this.outputTranscription += serverContent?.outputTranscription?.text;

      this.callbacks.onTranscript('model', this.outputTranscription, true);
    }

    // Gemini turnComplete fires when the AI finishes responding
    if (serverContent?.turnComplete) {
      console.log('[LiveManager] ✅ turnComplete');
      if (this.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', this.inputTranscription, false);
        this.inputTranscription = '';
      }

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
      } catch (e) {}
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
