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
- **AudioWorkletNode Architecture**: Replaced standard processor nodes in favor of a high-performance `AudioWorkletNode` (`mic-processor.js`). This enables non-blocking, multi-threaded extraction of raw PCM audio chunks running independently on the Audio Thread to securely pipe bytes into the Gemini Socket.
- **Wired UI Interactive Points**: The core user interface, specifically `controls-panel.tsx`, is now wired up to orchestrate `connect()` sessions. The `visualization-panel.tsx` features an immersive pulsing orb and waveform response setup mapped dynamically to AI dialogue interactions.

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
