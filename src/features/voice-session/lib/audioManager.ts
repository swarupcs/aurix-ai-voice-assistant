import { base64ToUint8Array, createPCMBlob, decodeAudioData } from '@/lib/audioUtils';
import { INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE } from '@/lib/constants';

export class AudioManager {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private isMuted: boolean = false;
  private outputAnalyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private playbackGeneration = 0;

  constructor() {}

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  public setMute(isMuted: boolean) {
    this.isMuted = isMuted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  public async initialize(onMicData: (blob: { data: string; mimeType: string }) => void): Promise<void> {
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

    await this.inputAudioContext.audioWorklet.addModule('/worklets/mic-processor.js');
    this.workletNode = new AudioWorkletNode(this.inputAudioContext, 'mic-processor');

    this.workletNode.port.onmessage = (event) => {
      if (this.isMuted) return;
      const pcmBlob = createPCMBlob(event.data as Float32Array);
      onMicData(pcmBlob);
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

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.inputAnalyser = this.inputAudioContext.createAnalyser();
    this.inputAnalyser.fftSize = 256;

    this.inputSource.connect(this.inputAnalyser);
    this.inputAnalyser.connect(this.workletNode);
  }

  public getAudioLevels(): { input: number; output: number } {
    let inputLevel = 0;
    let outputLevel = 0;

    if (this.outputAnalyser) {
      const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      outputLevel = Math.min(1, (sum / dataArray.length) / 255);
    }

    if (this.inputAnalyser) {
      const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.inputAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      inputLevel = Math.min(1, (sum / dataArray.length) / 255);
    }

    return { input: inputLevel, output: outputLevel };
  }

  public async playAudioChunk(audioData: string): Promise<void> {
    const uintData = base64ToUint8Array(audioData);
    if (!this.outputAudioContext || !this.outputNode) return;

    const currentGeneration = this.playbackGeneration;
    const audioBuffer = await decodeAudioData(
      uintData,
      this.outputAudioContext,
      OUTPUT_SAMPLE_RATE,
      1,
    );

    if (currentGeneration !== this.playbackGeneration) return;
    if (!this.outputAudioContext || !this.outputNode) return;

    const now = this.outputAudioContext.currentTime;

    this.outputNode.gain.cancelScheduledValues(now);
    this.outputNode.gain.setValueAtTime(1, now);

    if (this.nextStartTime < now) {
      this.nextStartTime = now;
    }

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });

    this.sources.add(source);
  }

  public fadeOutAndStop(): void {
    if (this.outputNode && this.outputAudioContext) {
      const now = this.outputAudioContext.currentTime;
      const endTime = Math.max(now, this.nextStartTime);
      const fadeDuration = 0.05;
      
      if (endTime > now + 0.01) {
         const startFadeTime = Math.max(now, endTime - fadeDuration);
         if (endTime > startFadeTime) {
           try {
             this.outputNode.gain.setValueAtTime(1, startFadeTime);
             this.outputNode.gain.linearRampToValueAtTime(0, endTime);
           } catch (e) {
             console.log('[AudioManager] Fade-out error safely caught:', e);
           }
         }
      }
    }
  }

  public stopAllAudio(): void {
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

  public disconnect(): void {
    this.stopAllAudio();
    this.inputSource?.disconnect();
    this.inputAnalyser?.disconnect();
    this.workletNode?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.outputNode?.disconnect();
  }
}
