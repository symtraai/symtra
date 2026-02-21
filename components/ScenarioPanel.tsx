'use client';

import Link from 'next/link';
import { Scenario, scenarios } from '@/lib/scenarios';
import { motion } from 'framer-motion';

interface ScenarioPanelProps {
  selectedId: string | null;
  onSelect: (scenario: Scenario) => void;
}

const severityColors = {
  CRITICAL: 'text-red-400 border-red-500',
  HIGH: 'text-orange-400 border-orange-500',
  MEDIUM: 'text-yellow-400 border-yellow-500',
};

const typeIcons: Record<string, string> = {
  TRAUMA: '🩸',
  MEDICAL: '💊',
  FIRE: '🔥',
};

export default function ScenarioPanel({ selectedId, onSelect }: ScenarioPanelProps) {
  return (
    <div className="w-80 h-full flex flex-col glass-panel border-r border-cyan-500/20 z-10">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-cyan-400/60 font-mono tracking-widest">DISPATCH CENTER</span>
        </div>
        <h1 className="text-cyan-300 font-mono text-sm font-bold tracking-wider">
          911 OPERATOR TRAINING
        </h1>
        <p className="text-cyan-500/40 font-mono text-[10px] mt-1">
          SELECT INCIDENT — {scenarios.length} ACTIVE
        </p>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-b border-cyan-500/10 flex justify-between text-[9px] font-mono text-cyan-500/40">
        <span>SYS_STATUS: <span className="text-green-400">ONLINE</span></span>
        <span>UNITS: <span className="text-cyan-300">6</span></span>
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
        {scenarios.map((scenario, i) => {
          const isSelected = scenario.id === selectedId;
          return (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSelect(scenario)}
              className={`w-full text-left p-3 rounded border transition-all duration-200 font-mono group
                ${isSelected
                  ? 'bg-cyan-500/10 border-cyan-400/60 shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                  : 'bg-cyan-500/5 border-cyan-500/15 hover:bg-cyan-500/10 hover:border-cyan-500/40'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-cyan-500/50 tracking-widest">{scenario.code}</span>
                <span className={`text-[8px] font-bold border px-1 rounded ${severityColors[scenario.severity]}`}>
                  {scenario.severity}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">{typeIcons[scenario.type]}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-cyan-100/80'}`}>
                  {scenario.title}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-cyan-400/50">
                  📍 {scenario.city}, {scenario.country}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded text-cyan-500/50 border border-cyan-500/20 ${isSelected ? 'text-cyan-400' : ''}`}>
                  {scenario.type}
                </span>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-cyan-500/20"
                >
                  <p className="text-[10px] text-cyan-300/60 leading-relaxed">
                    {scenario.description}
                  </p>
                  <Link
                    href={`/simulation/${scenario.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 flex items-center justify-center w-full py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-bold tracking-widest rounded hover:bg-red-500/30 transition-colors"
                  >
                    ▶ INITIATE CALL
                  </Link>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-cyan-500/10 text-[9px] font-mono text-cyan-500/30 space-y-1">
        <div className="flex justify-between">
          <span>POWERED BY</span>
          <span className="text-cyan-400/50">MINIMAX M.25</span>
        </div>
        <div className="flex justify-between">
          <span>VOICE ENGINE</span>
          <span className="text-cyan-400/50">VAPI + SPEECHMATICS</span>
        </div>
      </div>
    </div>
  );
}
