# 🎙️ Aurix AI Voice Assistant

Aurix is a real-time, interactive, browser-based AI voice assistant designed to help users learn languages by speaking. Built on the modern Next.js 14+ App Router, it provides a fluid user experience featuring dynamic 3D visualizations, ultra-low latency voice responses, and a robust architecture.

---

## 🌟 Overview & Key Features

Aurix leverages Google's Gemini 2.0 Live API to deliver zero-latency, human-like voice conversations. The application goes beyond text-based chat, using native Web Audio API protocols to stream audio directly to the AI model and back.

- **Ultra-Low Latency Voice Interfacing:** Native hardware-level microphone handling via `AudioWorkletNode` ensures raw PCM audio streaming directly to the Gemini WebSocket.
- **Multilingual Support (50+ Local Dialects):** Practice languages with regional accuracy, perfect for casual conversations, language practice, roleplay, or interview prep.
- **Dynamic AI Personas:** AI adjusts tone, language, and behavior instantly based on user-selected settings (Topic, Language, Skill Level, Voice).
- **Live Visualizations:** Features interactive 3D orb and waveform visualizers (Three.js/React Three Fiber) that react dynamically to user input and AI audio levels.
- **Ephemeral Token Security:** Keeps your API keys secure by fetching short-lived connection tokens from a server-side route.
- **Real-Time Transcription:** Seamless on-the-fly speech-to-text rendering with partial completion animations and barge-in (interruption) handling.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS v4, Framer Motion, Shadcn UI, Radix UI
- **State Management:** Zustand (`useAudioStore`)
- **AI Integration:** `@google/genai` (Gemini Live API)
- **Database & ORM:** PostgreSQL (Neon Serverless), Prisma
- **Authentication:** NextAuth.js (v5 Beta)
- **3D Graphics:** Three.js, React Three Fiber, React Drei (`@react-three/drei`)
- **Audio Processing:** Web Audio API, AudioWorklet, Base64 PCM Bit-Depth Conversion

---

## 📂 Codebase Structure & Directory Layout

The codebase is built with a feature-driven, modular architecture under the `src/` directory.

```text
src/
├── app/                  # Next.js App Router root
│   ├── (auth)/           # Authentication routes (Login page)
│   ├── (public)/         # Public marketing/landing pages
│   ├── api/              # API endpoints (Auth, Token generation)
│   ├── dashboard/        # Main application dashboard layout
│   ├── globals.css       # Global styles and Tailwind entry point
│   └── layout.tsx        # Root React layout
│
├── components/           # Reusable React components
│   ├── shared/           # Cross-feature components (Theme toggles, Sidebar headers)
│   └── ui/               # Shadcn UI primitives (Buttons, Dialogs, Sliders, Cards, etc.)
│
├── features/             # Domain-driven feature modules
│   ├── auth/             # Auth-specific UI/logic
│   ├── dashboard/        # Dashboard layout, tabs, LeftSidebar (Configuration)
│   ├── transcript/       # RightSidebar (Live conversation text UI)
│   └── voice-session/    # Core Audio/AI feature block
│       ├── components/   # ControlsPanel, StatusPanel, VisualizationPanel
│       ├── lib/          # LiveManager (WebSocket), AudioManager, TranscriptManager
│       └── store/        # Zustand global audio state (`useAudioStore.ts`)
│
├── hooks/                # Global React hooks (e.g., `use-mobile.ts`)
│
├── lib/                  # Utilities and core configurations
│   ├── audioUtils.ts     # Audio array scaling & PCM formatting for Gemini
│   ├── constants.ts      # App constants (Languages, Voices, Roles)
│   ├── prisma.ts         # Prisma client initialization
│   ├── auth.ts           # NextAuth setup and adapter injection
│   └── utils.ts          # Tailwind merge & general helpers
│
├── server/               # Server Actions (Next.js server-side mutations)
│   └── actions/          # User Preferences & Transcript persistence logic
│
└── types.ts              # Global TypeScript interfaces & enums
```

### 🧠 Core Functional Modules

#### 1. Audio & WebSocket Pipeline (`src/features/voice-session/lib/`)
- **`LiveManager.ts`:** The brain of the session. Manages the Gemini WebSocket connection. It formats the system prompt dynamically based on the user's settings, listens for `serverContent.interrupted` to handle barge-ins, and manages the real-time transcript streaming.
- **`AudioManager.ts`:** Deals exclusively with the Web Audio API. Configures hardware profiling (`echoCancellation`, `noiseSuppression`), isolates AudioContexts (16000Hz in / 24000Hz out), handles `mic-processor.js` worklets for non-blocking PCM extraction, and manages gapless sequential audio playback chunking.
- **`TranscriptManager.ts`:** Accumulates streamed partial text chunks from the AI, handling rapid UI updates and sanitizing filtered or blocked questions.

#### 2. Global State Management (`src/features/voice-session/store/useAudioStore.ts`)
- Utilizes **Zustand** to keep the complex asynchronous audio state completely decoupled from the React tree.
- Manages connection states (Connecting, Connected, Disconnected), tracks the active `LiveManager` singleton instance, handles hardware muting, and stores the live transcription arrays (`TranscriptItem[]`) driving the `RightSidebar` UI.

#### 3. User Interface & Components
- **`LeftSidebar.tsx` (Configuration):** Allows users to change their Language, Proficiency Level, Conversation Topic, and AI Voice on the fly. All changes are synchronized globally and persisted via Server Actions.
- **`RightSidebar.tsx` (Transcript):** Real-time text rendering matching the audio. It uses a sleek, animated interface to display partial texts as they arrive from the WebSocket, creating an illusion of the AI typing/speaking live.
- **`VisualizationPanel.tsx`:** An immersive Three.js environment that dynamically renders a pulsing orb and waveform. Logic scales and shifts colors based on input/output `volume` readings piped directly from the `AudioManager`.
- **`ControlsPanel.tsx`:** Primary interaction points (Connect, Disconnect, Mute). Disconnect gracefully terminates WebSockets, drops audio nodes, and triggers Server Actions to securely save the conversation history to the PostgreSQL database.

---

## 🔒 Security & Data Persistence

### Database Schema (Prisma)
- The project securely manages user data using Prisma with Neon DB.
- **`UserPreferences`:** Stores persistent UI choices like default language, topic, and voice.
- **`Conversation` & `Message`:** Automatically persists completed transcripts to the database right after the user ends a session.
- **Auth:** Standard `Account`, `Session`, `User` schema generated by `@auth/prisma-adapter`.

### Ephemeral Tokens
- To prevent API key leakage, the frontend never directly accesses `NEXT_PUBLIC_GEMINI_API_KEY`.
- Instead, the `useAudioStore` issues a `fetch('/api/token')` to a secure Next.js backend route, which hands back a short-lived token generated by the Google GenAI SDK. This ephemeral token is exclusively used to open the Gemini Live WebSocket.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- pnpm (Recommended)
- PostgreSQL Database URL (Neon or local)
- Google Generative AI API Key (Gemini)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/aurix"
   NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
   AUTH_SECRET="your-nextauth-secret-key"
   ```

3. **Initialize the Database:**
   Push the schema to your database and generate the Prisma Client:
   ```bash
   npx prisma db push
   pnpm run postinstall
   ```

4. **Run the Development Server:**
   ```bash
   pnpm run dev
   ```

5. **Start Talking:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser. Create an account, navigate to the dashboard, click the microphone button, and select "Connect" to instantly start your live audio session!

---

## 🔮 Future Enhancements
- Fine-grained Audio Volume controls and visualization geometry tweaks.
- Advanced metrics tracking (speaking time vs. listening time) on the Analytics dashboard.
- Selectable hardware device management mapped directly to `navigator.mediaDevices.enumerateDevices()`.