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
  private outputAnalyser: AnalyserNode | null = null;

  private inputTranscription = '';
  private outputTranscription = '';
  private audioQueue: Promise<void> = Promise.resolve();

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

      this.audioLevelInterval = setInterval(() => {
        if (!this.outputAnalyser) return;
        const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 255);
        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalized, 'output');
        }
      }, 50);

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

      this.inputSource.connect(this.workletNode);
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

    INSTRUCTIONS:
    1.  **Strictly** speak in ${config.selected_launguage_name}. Only use English if the user is completely stuck or asks for a translation.
    2.  **Correction Mode**:
        - If the user makes a grammar or pronunciation mistake, gently correct it *first*, then continue the conversation.
        - Format: "Small tip: In ${config.selected_launguage_name} we say [Correction]. Anyway, [Response]?"
    3.  **Conversation Flow**:
        - Keep responses concise (1-3 sentences).
        - Ask open-ended questions to keep the user talking.
    `;
  }

  async handleMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    if (serverContent?.interrupted) {
      this.stopAllAudio();
    }

    const inputT = serverContent?.inputTranscription;
    if (inputT) {
      if (inputT.text) {
        this.inputTranscription += inputT.text;
      }
      if (this.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', this.inputTranscription, !inputT.finished);
        if (inputT.finished) {
          this.inputTranscription = '';
        }
      }
    }

    const outputT = serverContent?.outputTranscription;
    if (outputT) {
      if (outputT.text) {
        this.outputTranscription += outputT.text;
      }
      if (this.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', this.outputTranscription, !outputT.finished);
        if (outputT.finished) {
          this.outputTranscription = '';
        }
      }
    }

    if (serverContent?.turnComplete) {
      // Safety fallback to commit partials if a turn strictly ends
      if (this.inputTranscription.trim()) {
        this.callbacks.onTranscript('user', this.inputTranscription, false);
        this.inputTranscription = '';
      }

      if (this.outputTranscription.trim()) {
        this.callbacks.onTranscript('model', this.outputTranscription, false);
        this.outputTranscription = '';
      }
    }

    const base64Data = serverContent?.modelTurn?.parts?.[0].inlineData?.data;

    if (!base64Data) return;

    this.audioQueue = this.audioQueue.then(() =>
      this.playAudioChunk(base64Data as string)
    );
  }

  async playAudioChunk(audioData: string) {
    const uintData = base64ToUint8Array(audioData);

    if (!this.outputAudioContext || !this.outputNode) return;

    // Decode audio data immediately without waiting in the queue
    const audioBufferPromise = decodeAudioData(
      uintData,
      this.outputAudioContext,
      OUTPUT_SAMPLE_RATE,
      1,
    );

    // Queue only the playback scheduling to ensure ordered output
    this.audioQueue = this.audioQueue.then(async () => {
      const audioBuffer = await audioBufferPromise;

      if (this.nextStartTime < this.outputAudioContext!.currentTime) {
        this.nextStartTime = this.outputAudioContext!.currentTime;
      }

      const source = this.outputAudioContext!.createBufferSource();

      source.buffer = audioBuffer;

      source.connect(this.outputNode!);

      source.start(this.nextStartTime);

      this.nextStartTime += audioBuffer.duration;

      source.addEventListener('ended', () => {
        this.sources.delete(source);
      });

      this.sources.add(source);
    });
  }

  async stopAllAudio() {
    this.audioQueue = Promise.resolve();

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

    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.activeSession) {
      this.activeSession.close();
      this.activeSession = null;
    }

    this.inputSource?.disconnect();
    this.workletNode?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.outputNode?.disconnect();

    this.callbacks.onStateChange(ConnectionState.DISCONNECTED);
  }
}
