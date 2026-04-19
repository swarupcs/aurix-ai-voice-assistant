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
- Renamed all UI text from "TalkGyan AI" to "Aurix" across `navbar.tsx`, `right-sidebar.tsx`, `layout.tsx`, and metadata fields.

---

## 2. 📦 Dependencies Added

| Package | Version | Purpose |
|---|---|---|
| `@google/genai` | `^1.50.1` | Google Gemini Live API SDK |
| `zustand` | `^5.0.12` | Global audio state management |

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
```

### Constructor
- Accepts a `LiveManagerCallbacks` typed object, storing it for use during session events.
- Instantiates `GoogleGenAI` with the `NEXT_PUBLIC_GEMINI_API_KEY` env variable.
- ⚠️ **Note**: Client-side API key is explicitly noted as temporary — will be replaced with ephemeral token generation for production.

### `startSession()` — Full Session Lifecycle
Wrapped in a `try/catch` for full error resilience. Steps:

1. Fires `callbacks.onStateChange(ConnectionState.CONNECTING)`.
2. Calls `this.ai.live.connect()` with:
   - Model: `gemini-2.5-flash-native-audio-preview-09-2025`
   - Config: `responseModalities: [Modality.AUDIO]` with a system instruction.
   - WebSocket callbacks:
     - `onopen` → fires `CONNECTED`
     - `onmessage` → `this.handleMessage` (bound)
     - `onerror` → fires `ERROR` with message `'Could not connect.'`
     - `onclose` → logs reason
3. Creates **two independent AudioContexts**:
   - Input: `16000 Hz` (matches Gemini's expected input sample rate)
   - Output: `24000 Hz` (matches Gemini's output sample rate)
4. Resumes suspended contexts (browsers often start them suspended).
5. Creates a `GainNode` → connected to `outputAudioContext.destination`.
6. Loads and instantiates the `AudioWorkletNode` from `/worklets/mic-processor.js`.
7. Sets `workletNode.port.onmessage` to call `createPCMBlob()` on each `Float32Array` frame, then sends via `activeSession.sendRealtimeInput({ audio: pcmBlob })`.
8. Opens `getUserMedia()` with hardware-level constraints: `sampleRate: 16000`, `channelCount: 1`, `echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`.
9. Connects `MediaStreamSource → WorkletNode`.
10. On any failure in `catch`: fires `ERROR` state + `'Something went wrong.'` error.

### `handleMessage(message: LiveServerMessage)`
- Parses `message.serverContent`.
- Checks `serverContent.interrupted` — if `true`, immediately calls `stopAllAudio()` (barge-in support).
- Extracts `serverContent.modelTurn.parts[0].inlineData.data` (Base64 PCM audio string).
- Calls `playAudioChunk(base64Data)`.

### `playAudioChunk(audioData: string)`
1. Decodes Base64 → `Uint8Array` via `base64ToUint8Array()`.
2. Decodes `Uint8Array` → `AudioBuffer` via `decodeAudioData()` at `24000 Hz`.
3. **Clock drift guard**: if `nextStartTime < outputAudioContext.currentTime`, snaps `nextStartTime` to `currentTime` to prevent past-scheduling artifacts.
4. Creates an `AudioBufferSourceNode`, sets its buffer, connects to `outputAudioContext.destination`.
5. Calls `source.start(nextStartTime)`.
6. Advances `nextStartTime += audioBuffer.duration` for gapless chaining.
7. Adds source to `this.sources` Set; auto-removes on `"ended"`.

### `stopAllAudio()`
- Iterates the `sources` Set, calls `.stop()` on each (inside `try/catch` to handle already-stopped nodes silently).
- Clears the Set.
- Resets `nextStartTime = outputAudioContext.currentTime`.

### `setMute(isMuted: boolean)`
- Stores the mute flag in `this.isMuted`.
- Calls `mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted)`.
- This operates at the **OS/driver level** — the microphone stops capturing entirely, vs a software mute that just drops packets. The stream stays alive so unmuting is instant.

---

## 4. 🎛 AudioWorklet Processor (`public/worklets/mic-processor.js`)

A minimal `AudioWorkletProcessor` subclass registered as `'mic-processor'`:

```js
class MicProcessor extends AudioWorkletProcessor {
  // Rate: sampleRate / RenderQuantumSize = 16000 / 128 = 125 frames/sec = every 8ms
  process(inputs) {
    const channelData = inputs[0][0]; // mono
    const pcm = new Float32Array(channelData.length);
    pcm.set(channelData); // copy buffer (prevent reuse issues)
    this.port.postMessage(pcm);
    return true;
  }
}
registerProcessor('mic-processor', MicProcessor);
```

- Runs on the dedicated **Audio Thread** (not the main JS thread).
- Posts a copied `Float32Array` 125 times per second at 8ms intervals.
- The copy is critical — the original `channelData` buffer is reused by the Web Audio engine.

---

## 5. 🔧 Audio Utilities (`src/lib/audioUtils.ts`)

### `createPCMBlob(data: Float32Array)`
Converts **mic output** → Gemini-compatible format:
1. Allocates `Int16Array` of same length.
2. For each sample: clamps to `[-1.0, 1.0]`, then scales: `< 0 → × 32768`, `≥ 0 → × 32767`.
3. Converts `Int16Array` → `Uint8Array` → `btoa()` Base64 string.
4. Returns `{ data: base64string, mimeType: 'audio/pcm;rate=16000' }`.

### `base64ToUint8Array(base64: string): Uint8Array`
Reverse of the above — decodes **server audio** for playback:
1. `atob()` decodes Base64 → binary string.
2. Maps each char to a `Uint8Array` byte.

### `decodeAudioData(data, ctx, sampleRate, numChannels): Promise<AudioBuffer>`
Converts **server `Uint8Array`** (Int16 PCM) → Web Audio `AudioBuffer`:
1. Wraps `Uint8Array` as `Int16Array` view.
2. Creates `AudioBuffer` with `numChannels` channels, `frameCount = data.length / numChannels`, at `sampleRate`.
3. Normalizes each `Int16` sample → Float32 by dividing by `32768.0`.
4. Supports multi-channel layouts via channel interleaving.

---

## 6. 🗃 Global State (`src/store/useAudioStore.ts`)

Built with **Zustand** + `devtools` middleware.

### Store Shape
```typescript
type AudioStore = {
  conectionState: ConnectionState;   // DISCONNECTED | CONNECTING | CONNECTED | ERROR
  error: string | null;              // human-readable error message
  isMuted: boolean;                  // current mic mute state
  liveManagerInstance: LiveManager;  // singleton service instance
  connect: () => Promise<void>;      // initiates a new session
  toggleMute: () => void;            // flips mute, syncs to hardware
}
```

### `connect()` Flow
1. Guards against double-connect if already `CONNECTING` or `CONNECTED`.
2. Resets `error` to null.
3. Requests mic permission early via `getUserMedia({ audio: true })` — catches and sets `'Microphone permission denied'` if rejected.
4. Creates a `LiveManager` singleton (once per session) with callbacks:
   - `onStateChange: (s) => set({ conectionState: s })`
   - `onError: (e) => set({ error: e })`
5. Calls `manager.startSession()`.

### `toggleMute()`
1. Reads current `isMuted`.
2. Flips it, calls `set({ isMuted: newState })`.
3. Calls `liveManagerInstance.setMute(newState)` to sync hardware track.

---

## 7. 🖥 UI Components

### `ControlsPanel` (`src/components/controls-panel.tsx`)
- Reads `{ connect, conectionState, toggleMute, isMuted }` from `useAudioStore`.
- `isConnected` and `isConnecting` are derived live from `conectionState`.
- **Connect button**: visible when `!isConnected && !isConnecting`, calls `connect()` on click.
- **End button**: visible when connecting/connected, disabled while `isConnecting`.
- **Mute button**: visible only when `isConnected`, calls `toggleMute()`, icon and red style driven by `isMuted`.
- `MicSelector` lets the user pick their input device before connecting.

### `StatusPanel` (`src/components/status-panel.tsx`)
- Reads `{ conectionState, error }` from `useAudioStore`.
- Animated pill badge with three states:
  - **Amber** `"Ready to Talk"` — disconnected
  - **Blue + pulse** `"Connecting..."` — connecting
  - **Emerald** `"Live Session"` — connected
- Error toast (red, dismissible-style) shown when `error !== null`.

### `Navbar` (`src/components/navbar.tsx`)
- Marked `'use client'` to fix Radix UI hydration mismatches.
- Uses `<Sheet>` components for mobile left (Config) and right (Transcript) sidebars.
- Logo `<Image>` has `priority`, `fill`, and `sizes` correctly set.

### `MicSelector` (`src/components/ui/mic-selector.tsx`)
- `useAudioDevices()` hook enumerates `audioinput` devices from `navigator.mediaDevices.enumerateDevices()`.
- Handles two permission flows: **without** (initial enum, may show generic labels) and **with** (opens a temp stream to unlock real device names, then stops it).
- Listens on `devicechange` event to refresh the list when hardware changes.
- Exposes a dropdown for device selection + a mute toggle with a live `LiveWaveform` preview.

### `VisualizationPanel` (`src/components/visualization-panel.tsx`)
- Renders an animated `<Orb>` (Three.js based) with brand yellow `#FFD439`.
- Center logo pulses via CSS `transform: scale()` based on `logoScale`.
- `<LiveWaveform>` bar waveform below the orb.
- ⚠️ `agentState` and `activeScale` are currently hardcoded — marked `// todo: make this dynamic` for the next iteration (will be driven by `onAudioLevel` callbacks).

---

## 8. 📐 Type Definitions (`src/types.ts`)

```typescript
enum ConnectionState { DISCONNECTED, CONNECTING, CONNECTED, ERROR }

interface TranscriptItem { id, sender: 'user'|'model', text, isPartial? }

interface AudioVolume { input: number, output: number }

interface LiveManagerCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onTranscript: (sender, text, isPartial) => void;
  onAudioLevel: (level, type: 'input'|'output') => void;
  onError: (error: string) => void;
}

interface ConnectConfig {
  selected_topic, selected_launguage_name, selected_launguage_code,
  selected_launguage_region, context, selected_proefficent_level,
  selected_assistant_voice
}
```

---

## 9. 🗺 Data Flow Diagram

```
User speaks
    │
    ▼
MediaStream (getUserMedia)
    │  16000Hz mono, echo/noise cancelled
    ▼
MediaStreamAudioSourceNode
    │
    ▼
AudioWorkletNode (mic-processor.js) ── Audio Thread, 125×/sec, 8ms frames
    │  Float32Array chunks via port.postMessage
    ▼
Main Thread: workletNode.port.onmessage
    │  createPCMBlob() → Float32 → Int16 → Base64
    ▼
activeSession.sendRealtimeInput({ audio: pcmBlob })
    │
    ▼ WebSocket (Gemini Live API)
    │
Gemini responds with audio/pcm;rate=24000 Base64 payload
    │
    ▼
handleMessage() → check interrupted → stopAllAudio() if yes
    │
    ▼
playAudioChunk()
    │  base64ToUint8Array() → decodeAudioData() → AudioBuffer
    │  Clock drift guard
    ▼
AudioBufferSourceNode.start(nextStartTime) ── gapless scheduling
    │
    ▼
outputAudioContext.destination → Speaker
```

---

## 10. 🔮 Upcoming / TODO

| Area | Status | Notes |
|---|---|---|
| `VisualizationPanel` agent state | ⏳ TODO | Drive `agentState` from `onAudioLevel` callback |
| `VisualizationPanel` logo scale | ⏳ TODO | Drive `activeScale` from real output audio volume |
| Transcript pipeline | ⏳ Not started | `onTranscript` callback defined in types but not implemented |
| Audio level monitoring | ⏳ Not started | `onAudioLevel` callback defined but not connected |
| Ephemeral token auth | ⏳ Not started | Replace client-side API key with short-lived tokens |
| `disconnect()` method | ⏳ Not started | Clean teardown of session, contexts, and streams |
| Selected mic device routing | ⏳ Not started | `MicSelector` device ID needs to be passed into `getUserMedia` |
