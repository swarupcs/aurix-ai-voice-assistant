# Aurix AI Voice Assistant — Complete Implementation Notes

A detailed breakdown of every technical decision and implementation made in the Aurix codebase so far, organized by layer.

---

## 1. 🛠 Project Setup & Bug Fixes

### Next.js 16 / Turbopack Compatibility

- **Problem**: The previous `BASE_URL = ''` caused `new URL('')` to throw a `TypeError: Invalid URL` at module evaluation time, crashing the entire Next.js SSR server with 500 errors.
- **Fix**: Changed `metadataBase` in `layout.tsx` to `BASE_URL ? new URL(BASE_URL) : undefined` — safely omitting `metadataBase` when no production URL is set, which causes Next.js to default to `http://localhost:3000` in dev.

### Hydration Mismatch Fix (`navbar.tsx`)

- **Problem**: `Navbar` was a Server Component but used Radix UI's `<SheetTrigger asChild>` which clones its child and attaches event listeners. This is illegal in RSC — the browser received a different DOM tree than what the server rendered, causing a full React hydration crash.
- **Fix**: Added `'use client'` directive to `navbar.tsx`, making it a Client Component so Radix can correctly attach `onClick`, `aria-*`, and `data-state` props without conflict.

### Syntax Errors Fixed

- Fixed an **unterminated string literal** on the `alt` prop of the logo `<Image>` — `alt='Aurix` was missing the closing quote, causing the entire file to fail parsing.
- Added a missing `sizes` prop to the logo `<Image fill />` to resolve the Next.js performance warning about missing responsive size hints for LCP images.

### Branding Update

- Renamed all UI text from "Aurix AI" to "Aurix" (and standardizing component nomenclature) across `navbar.tsx`, `right-sidebar.tsx`, `layout.tsx`, and metadata fields.

---

## 2. 📦 Dependencies Added

| Package         | Version   | Purpose                       |
| --------------- | --------- | ----------------------------- |
| `@google/genai` | `^1.50.1` | Google Gemini Live API SDK    |
| `zustand`       | `^5.0.12` | Global audio state management |

---

## 3. 🔌 Gemini Live API Integration (`src/services/liveManager.ts`)

`LiveManager` is a TypeScript class that owns the entire lifecycle of a Gemini Live WebSocket session. It is designed as a **singleton** — one instance per session, held in the Zustand store.

### Class Fields

```typescript
private ai: GoogleGenAI               // API client
private activeSession: Session | null  // live WebSocket session
private inputAudioContext: AudioContext | null   // 16000 Hz — mic capture
private outputAudioContext: AudioContext | null  // 24000 Hz — AI output
private outputNode: GainNode | null    // output gain node
private mediaStream: MediaStream | null  // raw mic hardware stream
private workletNode: AudioWorkletNode | null  // threaded mic processor
private inputSource: MediaStreamAudioSourceNode | null
private nextStartTime: number = 0     // monotonic scheduling clock
private sources: Set<AudioBufferSourceNode>  // active playback pool
private callbacks: LiveManagerCallbacks  // state notification bridge
private isMuted: boolean              // current mute state
private inputTranscription = '';      // buffer for partial user text
private outputTranscription = '';     // buffer for partial ai text
```

### Constructor

- Accepts a `LiveManagerCallbacks` typed object, storing it for use during session events.
- Instantiates `GoogleGenAI` with the `NEXT_PUBLIC_GEMINI_API_KEY` env variable.

### `startSession()` — Full Session Lifecycle

Wrapped in a `try/catch` for full error resilience. Steps:

1. Fires `callbacks.onStateChange(ConnectionState.CONNECTING)`.
2. Calls `this.ai.live.connect()` with:
   - Model: `gemini-2.5-flash-native-audio-preview-09-2025`
   - Config: `responseModalities: [Modality.AUDIO]`, system instructions, and enabling `inputAudioTranscription`/`outputAudioTranscription`.
   - WebSocket callbacks (`onopen`, `onmessage`, `onerror`, `onclose`).
3. Creates **two independent AudioContexts** (`16000 Hz` for input, `24000 Hz` for output).
4. Creates a `GainNode` → connected to `outputAudioContext.destination`.
5. Loads and instantiates the `AudioWorkletNode` from `/worklets/mic-processor.js`.
6. Sets `workletNode.port.onmessage` to call `createPCMBlob()` on each `Float32Array` frame, then sends via `activeSession.sendRealtimeInput({ audio: pcmBlob })`.
7. Opens `getUserMedia()` with hardware-level constraints: `sampleRate: 16000`, `channelCount: 1`, `echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`.

### `handleMessage(message: LiveServerMessage)`

- Checks `serverContent.interrupted` — if `true`, calls `stopAllAudio()` (barge-in support).
- Detects `inputTranscription.text` / `outputTranscription.text` packets and streams them up via `callbacks.onTranscript`.
- Recognizes `turnComplete`, emitting a final packet to seal text bubbles.
- Extracts `inlineData.data` Base64 PCM audio string and hits `playAudioChunk(base64Data)`.

### `playAudioChunk(audioData: string)`

1. Base64 → `Uint8Array` → `decodeAudioData()` at `24000 Hz`.
2. **Clock drift guard**: if `nextStartTime < outputAudioContext.currentTime`, snaps `nextStartTime` to `currentTime` to prevent past-scheduling artifacts.
3. Spawns an `AudioBufferSourceNode`, schedules it using `.start(nextStartTime)`.
4. Advances `nextStartTime += audioBuffer.duration` for gapless chaining.
5. Adds source to `this.sources` Set; auto-removes on `"ended"`.

### `setMute(isMuted: boolean)`

- Calls `mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted)`.
- Operating at the **OS/driver level** to block packet collection.

### `disconnect()`

- Exhaustively terminates the session memory space preventing zombie workers.
- Fires `stopAllAudio()`.
- Closes the WebSocket `.activeSession()`.
- Unplugs native pipes `.workletNode.disconnect()` and drops both `AudioContext.close()` threads.

---

## 4. 🎛 AudioWorklet Processor (`public/worklets/mic-processor.js`)

A minimal `AudioWorkletProcessor` subclass registered as `mic-processor` that copies channel vectors in isolated detached threads 125 times per second at ~8-millisecond loop barriers.

---

## 5. 🔧 Audio Utilities (`src/lib/audioUtils.ts`)

- **`createPCMBlob`**: Scales user input bounds up to `[-32768, 32767]` Int16 arrays and b64 encodes them.
- **`decodeAudioData`**: Performs fraction math `/ 32768.0` converting Gemini bytes descending back to traditional `Float32Array` values recognized by the browser node maps.

---

## 6. 🗃 Global State (`src/store/useAudioStore.ts`)

Built with **Zustand** + `devtools` middleware.

### Store Shape

```typescript
type AudioStore = {
  conectionState: ConnectionState;
  error: string | null;
  isMuted: boolean;
  transcript: TranscriptItem[];
  liveManagerInstance: LiveManager;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => void;
};
```

### Transcript Handling Logic

When the store fires `onTranscript(sender, text, isPartial)`, it performs a deep smart scan manipulating `state.transcript`:

- `findLastIndex` locates open trailing objects where `isPartial === true`.
- Native object property manipulation streams text without DOM breaking.
- Automatically seals chunks locking `.isPartial = false` resolving cleanly.

### Teardown / Disconnect Lifecycle

- `disconnect()` overrides store parameters while assigning `state.liveManagerInstance = undefined` initiating garbage collection routines immediately.

---

## 7. 🖥 UI Components

### `ControlsPanel` (`src/components/controls-panel.tsx`)

- Reads live reactive states.
- Connect button mounts only when disconnected.
- Red "End Chat" securely dispatches global system teardown `.disconnect()`.
- Mute binds OS hardware `toggleMute()`.

### `RightSidebar` (`src/components/right-sidebar.tsx`)

- Connected to `useAudioStore().transcript`. Iterates through dynamic arrays generating active text bubbles formatted securely for internal models vs users.

### `StatusPanel` (`src/components/status-panel.tsx`)

- Reads {conectionState} to drive badge layouts (Amber, Blue Pulsing, Emerald).

### `MicSelector` (`src/components/ui/mic-selector.tsx`)

- Fetches navigator devices directly bypassing constraints inside `loadDevicesWithoutPermission`.
- Renders dual interface previews utilizing a native visualizer (`<LiveWaveform>`).

### `VisualizationPanel` (`src/components/visualization-panel.tsx`)

- ⚠️ Target point for next implementation logic.

---

## 8. ⚙️ Dynamic AI Persona & Configuration Pipeline

This update connects the User Interface configuration options natively into the AI's generation prompt, making the AI react dynamically as a custom language tutor:

- **Zustand UI State Connectors**: State variables (`selectedLanguage`, `selectedProficiencyLevel`, `selectedTopic`, `selectedAssistantVoice`) were added to `useAudioStore`, tracking the Dropdown menus physically attached inside `LeftSidebar`.
- **System Prompt Generation (`LiveManager`)**: Designed `generateSystemPrompt(config)` to dynamically format a strict instruction set before initiating the WebSocket. It injects the user's selected configurations directly into the prompt (e.g., instructing the AI to "strictly speak in Spanish", "correct mistakes", and "act as a language tutor").
- **Google Voice Binding (`prebuiltVoiceConfig`)**: Configured the exact `voiceName` chosen by the UI (e.g. `Puck`, `Aoede`, `Charon`) deeply within the `speechConfig` payload connecting to the Gemini WebSocket, instantly assigning the AI's speaking tone and pitch.

---

## 9. 🔒 Ephemeral Token Security Pipeline

To secure the application for production, the client-side API Key exposure has been eliminated by bridging authorization to a secure NodeJS backend handler:

- **Token Fetching Protocol (`useAudioStore`)**: The `connect()` method now halts and executes an `await fetch('/api/token')` to a secure internal route.
- **Client-Side Key Removal**: `LiveManager` historically held `NEXT_PUBLIC_GEMINI_API_KEY`. This was completely ripped out. The `LiveManager` constructor now strictly accepts a short-lived ephemeral `'token.name'` parameter.
- **Alpha API Binding**: The GenAI SDK initialization was upgraded to bind `apiVersion: 'v1alpha'` to explicitly support Google's required endpoints for ephemeral token-based WebSocket routing.

---

## 10. 🗺 Data Flow Diagram

```text
User speaks
    │
    ▼
MediaStream (getUserMedia)
    │  16000Hz mono, echo/noise cancelled
    ▼
AudioWorkletNode (mic-processor.js) ── Audio Thread, 125×/sec, 8ms frames
    │
    ▼
Main Thread: handleMessage() → createPCMBlob()
    │
    ▼
Gemini WebSocket ───►  Transcriptions (RightSidebar DOM)
    │                  Audio Chunks
    ▼
playAudioChunk() → base64ToUint8Array() → decodeAudioData()
    │
    ▼
AudioBufferSourceNode.start(nextStartTime) ── gapless buffer logic
    │
    ▼
Speaker
```

---

## 9. 🔮 Upcoming / Remaining TODO Checklist

| Area             | Component             | Notes                                                                           |
| ---------------- | --------------------- | ------------------------------------------------------------------------------- |
| Level Dynamics   | `VisualizationPanel`  | Extract active `onAudioLevel` payload variables adjusting orbit geometry.       |
| Selected Devices | `LiveManager`         | Intercept hardware IDs connecting `enumerateDevices()` to local instantiations. |
| Audio Volumes    | `store/useAudioStore` | Expand types accepting generic payload variables parsing `AudioVolume` types.   |
