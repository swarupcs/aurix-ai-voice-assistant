# Aurix AI Voice Assistant

Aurix is a real-time, interactive, browser-based AI voice assistant designed to help learn languages by speaking. Built on the modern Next.js 14+ App Router, it provides a fluid user experience featuring dynamic visualizations and responsive UI elements. 

## Recent Implementation Updates

The latest updates established the core conversational backend and audio piping functionality:

- **Google Gemini Live API Integration (`@google/genai`)**: Constructed a new singleton `LiveManager` to handle real-time WebSockets with the `gemini-2.5-flash-native-audio-preview-09-2025` model for instantaneous raw-audio in & out interactions.
- **Zustand State Management (`useAudioStore`)**: Created an audio store to track and manage connection states (Connected, Linking, Disconnected), device permission errors, and the active `LiveManager` session securely across the application.
- **Microphone Hardware Permissions Handling (`MicSelector`)**: Rebuilt the `useAudioDevices` hook to seamlessly handle browser constraints when enumerating `audioinput` devices, ensuring robust request flows before and after microphone permissions are granted.
### 🎙️ Advanced Web Audio API Pipeline (`LiveManager.ts`)
To process low-latency, raw voice input suitable for the Gemini Live API, we bypass legacy browser constraints by utilizing native hardware protocols:
- **Hardware Profile Optimizations**: Configures active filtering via `navigator.mediaDevices`, forcing hardware-level `echoCancellation`, `noiseSuppression`, and `autoGainControl` settings to maximize vocal clarity en-route to the AI.
- **Independent AudioContexts**: Instantiates dedicated input (`16000 Hz`) and output (`24000 Hz`) contexts perfectly tailored to the model's expected sample rates without artifact upsampling.
- **AudioWorkletNode Architecture**: Replaced standard processor nodes in favor of a high-performance `AudioWorkletNode` (`mic-processor.js`). This enables non-blocking, multi-threaded extraction of raw PCM audio chunks running independently on the Audio Thread.
- **Real-time PCM Bit-Depth Conversion (`audioUtils.ts`)**: Implements on-the-fly mathematical conversion bridging browser audio (`Float32Array` mapped `[-1.0, 1.0]`) into Gemini-required deep audio (`Int16Array` mapped `[-32768, 32767]`), clamping outliers to eliminate clipping. 
- **Active Base64 WebSocket Piping**: Utilizing the `@google/genai` Live API method `sendRealtimeInput({ audio: pcmBlob })`, encoded `Int16` sound chunks are fed at ultra-low latencies directly down the secure socket without chunk buffering delays.
- **Wired UI Interactive Points**: The core user interface, specifically `controls-panel.tsx`, is now wired up to orchestrate `connect()` sessions. The `visualization-panel.tsx` features an immersive pulsing orb and waveform response setup mapped dynamically to AI dialogue interactions.

### 🔊 AI Audio Response & Playback Pipeline (`LiveManager.ts` + `audioUtils.ts`)
With the microphone input established, this update closes the feedback loop by implementing the full AI-to-speaker audio playback pipeline:

- **Centralized Message Handler (`handleMessage`)**: Replaced inline `onmessage` logging with a dedicated `handleMessage` method bound to the Gemini WebSocket. It parses `LiveServerMessage` responses, extracts the `inlineData` Base64 audio payload from `serverContent.modelTurn.parts[0]`, and immediately dispatches it to the audio playback queue.
- **Base64 to `Uint8Array` Decoding (`base64ToUint8Array`)**: Added a reverse utility in `audioUtils.ts` that mirrors the send-side encoding. Uses `atob()` to decode the server's Base64 string back into a raw `Uint8Array` byte buffer, ready for audio decoding.
- **Int16 to Float32 Audio Decoding (`decodeAudioData`)**: Converts the raw server `Uint8Array` (16-bit linear PCM at `24000 Hz`) back into a Web Audio API native `AudioBuffer` by normalizing each `Int16` sample (`/ 32768.0`) into the `[-1.0, 1.0]` float range the browser expects. Supports multi-channel layouts via a parameterized `numChannels` argument.
- **Gapless Sequential Audio Scheduling (`playAudioChunk`)**: To eliminate the stutter and clicks that occur when audio buffers are played one-by-one, `AudioBufferSourceNode` chunks are scheduled using a monotonically advancing `nextStartTime` clock. Each new chunk is queued to start exactly when the previous one ends (`nextStartTime += audioBuffer.duration`), producing perfectly seamless streaming playback regardless of network jitter.
- **Active Source Tracking**: Each playing `AudioBufferSourceNode` is tracked in a `Set<AudioBufferSourceNode>`. Nodes auto-remove themselves on the `"ended"` event, keeping a live reference pool for future disconnect/interrupt control.

### ⚡ Audio Interrupt Handling & Playback Resilience (`LiveManager.ts`)
This update hardens the playback pipeline against real-world edge cases — interruptions, late starts, and stale clock states:

- **Server Interrupt Detection**: `handleMessage` now inspects `serverContent.interrupted`. When Gemini signals a barge-in (the user speaks over the assistant), `stopAllAudio()` is called immediately to flush all queued audio and halt playback before the stale response finishes playing.
- **`stopAllAudio()` — Full Playback Teardown**: Iterates the active `Set<AudioBufferSourceNode>`, calling `.stop()` on each node inside a `try/catch` to silently handle already-finished sources. The Set is then cleared and `nextStartTime` is reset to `outputAudioContext.currentTime`, leaving the scheduler in a clean state ready for the next response.
- **Clock Drift Guard in `playAudioChunk`**: If the accumulated `nextStartTime` ever falls behind the `AudioContext`'s live `currentTime` (e.g. after a long pause, an interruption, or tab throttling), it is reset to `currentTime` before scheduling the next chunk. This prevents audio from being scheduled in the past, which would cause the Web Audio API to immediately fire it (causing double-plays or desync artifacts).

## Setup & Development

### Important Environment Setup
You need an active Google Generative AI API Project key with access to the multimodal audio API models.

1. Create a `.env` in the root of the project:
```bash
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```
*(Ensure you secure your exposed tokens when moving to a production environment).*

### Quick Start

1. Install all dependencies using `pnpm`:
```bash
pnpm install
```

2. Run the development server locally:
```bash
pnpm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your web browser. Click the microphone button and "Connect" to instantly start your live audio session with the Aurix assistant!
