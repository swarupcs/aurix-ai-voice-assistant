import { ConnectConfig, ConnectionState, LiveManagerCallbacks } from '@/types';
import {
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';
import { MODEL } from '@/lib/constants';
import { AudioManager } from './audioManager';
import { TranscriptManager, isBlockedQuestion } from './transcriptManager';

export class LiveManager {
  private ai: GoogleGenAI;
  private activeSession: Session | null = null;
  private callbacks: LiveManagerCallbacks;
  
  private audioManager: AudioManager;
  private transcriptManager: TranscriptManager;

  private audioLevelInterval: NodeJS.Timeout | null = null;
  private isUserSpeaking = false;
  private speechSilenceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SPEECH_THRESHOLD = 0.04;
  private readonly SILENCE_DEBOUNCE_MS = 300;

  constructor(callbacks: LiveManagerCallbacks, token: string) {
    this.ai = new GoogleGenAI({
      apiKey: token,
      apiVersion: 'v1alpha',
      vertexai: false,
    });
    this.callbacks = callbacks;
    this.audioManager = new AudioManager();
    this.transcriptManager = new TranscriptManager({
      onTranscript: (sender, text, isPartial) => this.callbacks.onTranscript(sender, text, isPartial)
    });
  }

  public getMediaStream(): MediaStream | null {
    return this.audioManager.getMediaStream();
  }

  public setMute(isMuted: boolean) {
    this.audioManager.setMute(isMuted);
  }

  async startSession(connectConfig: ConnectConfig) {
    try {
      console.log('starting the session');
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
          onclose: (e) => {
            console.log('Closed:', e.reason);
            this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
          },
        },
      });

      await this.audioManager.initialize((pcmBlob) => {
        this.activeSession?.sendRealtimeInput({ audio: pcmBlob });
      });

      this.transcriptManager.startLocalTranscription(connectConfig.selected_launguage_code, this.activeSession);

      this.audioLevelInterval = setInterval(() => {
        const levels = this.audioManager.getAudioLevels();
        this.callbacks.onAudioLevel(levels.output, 'output');
        this.callbacks.onAudioLevel(levels.input, 'input');

        if (levels.input > this.SPEECH_THRESHOLD) {
          if (this.speechSilenceTimer) {
            clearTimeout(this.speechSilenceTimer);
            this.speechSilenceTimer = null;
          }
          if (!this.isUserSpeaking) {
            this.isUserSpeaking = true;
            this.callbacks.onUserSpeaking(true);
          }
        } else if (this.isUserSpeaking) {
          if (!this.speechSilenceTimer) {
            this.speechSilenceTimer = setTimeout(() => {
              this.isUserSpeaking = false;
              this.callbacks.onUserSpeaking(false);
              this.speechSilenceTimer = null;
            }, this.SILENCE_DEBOUNCE_MS);
          }
        }
      }, 33);
    } catch (e) {
      console.error(e);
      this.callbacks.onStateChange(ConnectionState.ERROR);
      this.callbacks.onError('Something went wrong.');
    }
  }

  private generateSystemPrompt(config: ConnectConfig) {
    let basePrompt = `ROLE: You are an expert AI Voice Assistant. Your name is "Aurix".\n\n`;

    const langInstruction = `The user will be speaking to you in ${config.selected_launguage_name}. You must transcribe their audio as ${config.selected_launguage_name} and respond in ${config.selected_launguage_name}.`;

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

  async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;
    const tm = this.transcriptManager;

    if (serverContent?.interrupted) {
      console.log('[LiveManager] ⚡ INTERRUPTED');
      this.audioManager.stopAllAudio();
      
      if (tm.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', tm.inputTranscription, false);
        tm.inputTranscription = '';
      }
      if (tm.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', tm.outputTranscription, false);
        tm.outputTranscription = '';
      }
      tm.geminiInputActive = false;
      tm.localInputText = '';
    }

    if (serverContent?.inputTranscription?.text) {
      console.log('[LiveManager] 🎤 inputTranscription:', JSON.stringify(serverContent.inputTranscription.text));
      if (!tm.geminiInputActive) tm.geminiInputActive = true;
      tm.inputTranscription += serverContent.inputTranscription.text;

      if (isBlockedQuestion(tm.inputTranscription)) {
        this.callbacks.onTranscript('user', '[Filtered]', true);
      } else {
        this.callbacks.onTranscript('user', tm.inputTranscription, true);
      }
    }

    if (serverContent?.inputTranscription?.finished) {
      console.log('[LiveManager] 🎤 inputTranscription FINISHED');
      const safetyUserText = tm.inputTranscription.trim() || tm.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
           console.log('[LiveManager] 🛑 Blocked question detected — filtering transcript');
           this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
           this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      tm.inputTranscription = '';
      tm.geminiInputActive = true;
      tm.localInputText = '';
    }

    if (serverContent?.outputTranscription?.text) {
      console.log('[LiveManager] 🤖 outputTranscription:', JSON.stringify(serverContent.outputTranscription.text));
      tm.outputTranscription += serverContent.outputTranscription.text;
      this.callbacks.onTranscript('model', tm.outputTranscription, true);
    }

    const isModelResponding = !!(serverContent?.modelTurn || serverContent?.outputTranscription?.text);
    if (isModelResponding) {
      const safetyUserText = tm.inputTranscription.trim() || tm.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
          this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
          this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      tm.inputTranscription = '';
      tm.localInputText = '';
      tm.geminiInputActive = true;
    }

    if (serverContent?.turnComplete) {
      console.log('[LiveManager] ✅ turnComplete');
      this.audioManager.fadeOutAndStop();

      const safetyUserText = tm.inputTranscription.trim() || tm.localInputText.trim();
      if (safetyUserText) {
        if (isBlockedQuestion(safetyUserText)) {
          this.callbacks.onTranscript('user', '[Filtered]', false);
        } else {
          this.callbacks.onTranscript('user', safetyUserText, false);
        }
      }
      tm.inputTranscription = '';
      tm.localInputText = '';

      if (tm.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', tm.outputTranscription, false);
        tm.outputTranscription = '';
      }

      tm.geminiInputActive = false;
      tm.localInputText = '';
      tm.restartLocalTranscription();
    }

    if (serverContent && !serverContent.inputTranscription && !serverContent.outputTranscription 
        && !serverContent.turnComplete && !serverContent.interrupted && !serverContent.modelTurn) {
      console.log('[LiveManager] 📦 Unhandled serverContent keys:', Object.keys(serverContent));
    }

    const parts = serverContent?.modelTurn?.parts;
    if (parts) {
      const currentText = tm.inputTranscription || tm.localInputText;
      if (isBlockedQuestion(currentText)) {
        console.log('[LiveManager] 🛑 Blocked audio playback for identity question.');
        return;
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          this.audioManager.playAudioChunk(part.inlineData.data as string);
        }
      }
    }
  }

  disconnect() {
    this.audioManager.disconnect();
    this.transcriptManager.resetState();

    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
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

    this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
  }
}
