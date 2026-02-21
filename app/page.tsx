'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Scenario } from '@/lib/scenarios';
import ScenarioPanel from '@/components/ScenarioPanel';
import ScanlineOverlay from '@/components/ScanlineOverlay';

// Dynamically import WorldMap to avoid SSR issues with Mapbox
const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

export default function HomePage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#010b14] relative">
      <ScanlineOverlay />

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 h-8 z-20 glass-panel border-b border-cyan-500/20 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-mono tracking-[0.3em] text-red-400">LIVE</span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-cyan-500/50">
            SYMTRA DISPATCH TRAINING SYSTEM v2.5
          </span>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-mono text-cyan-500/40">
          <span>AI: <span className="text-cyan-300">MINIMAX M.25</span></span>
          <span>VOICE: <span className="text-cyan-300">VAPI</span></span>
          <span>STT: <span className="text-cyan-300">SPEECHMATICS</span></span>
          <span className="text-cyan-500/30">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex w-full h-full pt-8">
        {/* Left: Scenario Panel */}
        <ScenarioPanel
          selectedId={selectedScenario?.id ?? null}
          onSelect={setSelectedScenario}
        />

        {/* Center: World Map */}
        <div className="flex-1 relative">
          <WorldMap
            selectedScenario={selectedScenario}
            onScenarioSelect={setSelectedScenario}
          />
        </div>

        {/* Right: Info panel when no scenario selected */}
        {!selectedScenario && (
          <div className="w-64 glass-panel border-l border-cyan-500/20 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-4">🌐</div>
            <p className="text-[10px] font-mono text-cyan-500/50 tracking-widest mb-2">SELECT INCIDENT</p>
            <p className="text-[10px] font-mono text-cyan-500/30 leading-relaxed">
              Click a scenario from the sidebar or tap an incident pin on the map to begin training.
            </p>
            <div className="mt-6 space-y-2 text-[9px] font-mono text-cyan-500/30 text-left w-full">
              <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                <span>TRAUMA</span>
                <span className="text-red-400">2 ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                <span>MEDICAL</span>
                <span className="text-orange-400">3 ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-cyan-500/10 pb-1">
                <span>FIRE</span>
                <span className="text-yellow-400">1 ACTIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
