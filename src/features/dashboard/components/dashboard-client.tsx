'use client';

import StatusPanel from "@/features/voice-session/components/status-panel";
import ControlsPanel from "@/features/voice-session/components/controls-panel";
import VisualizationPanel from "@/features/voice-session/components/visualization-panel";

export function DashboardClient() {
  return (
    <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden animate-in fade-in duration-500">
      {/* Ambient dynamic radial glow behind the visualization */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.03] pointer-events-none" />

      {/* Status Panel */}
      <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none transition-all">
        <StatusPanel />
      </div>

      {/* Center Visualization */}
      <div className="flex-1 w-full h-full flex items-center justify-center relative z-10 pb-20">
        <VisualizationPanel />
      </div>

      {/* Bottom Dock Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
        <div className="pointer-events-auto transform transition-transform hover:-translate-y-1 duration-300">
          <ControlsPanel />
        </div>
      </div>
    </div>
  );
}
