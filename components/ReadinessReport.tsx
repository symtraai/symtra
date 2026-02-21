'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getHistory, computeReadiness, clearHistory } from '@/lib/history';

interface ReadinessReportProps {
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  TRAUMA: 'text-red-400',
  MEDICAL: 'text-orange-400',
  FIRE: 'text-yellow-400',
};

export default function ReadinessReport({ onClose }: ReadinessReportProps) {
  const history = getHistory();
  const report = computeReadiness(history);
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    clearHistory();
    setConfirmClear(false);
    onClose();
  }

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (report.overallScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="scanlines fixed inset-0 pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto glass-panel border border-cyan-500/30 rounded-lg mx-4 scrollbar-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-panel border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono tracking-[0.3em] text-cyan-500/50 mb-0.5">OPERATOR ASSESSMENT</p>
            <h2 className="text-cyan-300 font-mono text-sm font-bold tracking-wider">REAL-WORLD READINESS REPORT</h2>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-500/40 hover:text-cyan-300 transition-colors font-mono text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score + Tier row */}
          <div className="flex items-center gap-8">
            {/* Circular score gauge */}
            <div className="relative flex-shrink-0">
              <svg width="100" height="100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={report.overallScore >= 75 ? '#4ade80' : report.overallScore >= 50 ? '#facc15' : '#f87171'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={report.totalAttempts === 0 ? circumference : dashOffset}
                  style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold font-mono ${report.overallScore >= 75 ? 'text-green-400' : report.overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {report.overallScore}
                </span>
                <span className="text-[8px] font-mono text-cyan-500/40">/ 100</span>
              </div>
            </div>

            {/* Tier + stats */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[9px] font-mono text-cyan-500/40 tracking-widest mb-1">READINESS TIER</p>
                <p className={`text-3xl font-bold font-mono tracking-widest ${report.tierColor}`}>
                  {report.tier}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="SIMULATIONS" value={String(report.totalAttempts)} />
                <Stat label="SURVIVED" value={String(report.survivedCount)} color="text-green-400" />
                <Stat label="SURVIVAL RATE" value={`${report.survivalRate}%`} color={report.survivalRate >= 70 ? 'text-green-400' : 'text-red-400'} />
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="glass-panel border border-cyan-500/20 rounded p-4">
            <p className="text-[9px] font-mono text-cyan-500/40 tracking-widest mb-2">▶ AI RECOMMENDATION</p>
            <p className="text-[11px] font-mono text-cyan-200/80 leading-relaxed">{report.recommendation}</p>
          </div>

          {/* Strengths / Weaknesses / Fatal */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel border border-green-500/20 rounded p-4">
              <p className="text-[9px] font-mono text-green-400/60 tracking-widest mb-3">✓ TOP STRENGTHS</p>
              {report.topStrengths.length === 0
                ? <p className="text-[10px] font-mono text-cyan-500/30">Complete simulations to see strengths</p>
                : report.topStrengths.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="text-green-500 text-[10px] flex-shrink-0">▸</span>
                    <span className="text-[10px] font-mono text-green-300/80">{s}</span>
                  </div>
                ))}
            </div>

            <div className="glass-panel border border-yellow-500/20 rounded p-4">
              <p className="text-[9px] font-mono text-yellow-400/60 tracking-widest mb-3">⚠ RECURRING GAPS</p>
              {report.topWeaknesses.length === 0
                ? <p className="text-[10px] font-mono text-cyan-500/30">No weaknesses recorded yet</p>
                : report.topWeaknesses.map((w, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="text-yellow-500 text-[10px] flex-shrink-0">▸</span>
                    <span className="text-[10px] font-mono text-yellow-300/80">{w}</span>
                  </div>
                ))}
            </div>

            <div className="glass-panel border border-red-500/20 rounded p-4">
              <p className="text-[9px] font-mono text-red-400/60 tracking-widest mb-3">✕ FATAL PATTERNS</p>
              {report.fatalMistakes.length === 0
                ? <p className="text-[10px] font-mono text-green-400/50">No fatal errors recorded</p>
                : report.fatalMistakes.map((f, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="text-red-500 text-[10px] flex-shrink-0">✕</span>
                    <span className="text-[10px] font-mono text-red-300/80">{f}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Scenario breakdown */}
          {report.scenarioBreakdown.length > 0 && (
            <div>
              <p className="text-[9px] font-mono text-cyan-500/40 tracking-widest mb-3">SCENARIO PERFORMANCE LOG</p>
              <div className="space-y-2">
                {report.scenarioBreakdown.map((s) => (
                  <div key={s.id} className="glass-panel border border-cyan-500/10 rounded p-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-mono font-bold ${typeColors[s.type] ?? 'text-cyan-400'}`}>{s.type}</span>
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">{s.title}</span>
                        <span className="text-[9px] font-mono text-cyan-500/40">— {s.city}</span>
                      </div>
                      <div className="w-full bg-cyan-500/10 rounded-full h-1 mt-1.5">
                        <div
                          className={`h-1 rounded-full transition-all ${s.bestScore >= 70 ? 'bg-green-400' : s.bestScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${s.bestScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold font-mono ${s.bestScore >= 70 ? 'text-green-400' : s.bestScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.bestScore}
                      </p>
                      <p className="text-[8px] font-mono text-cyan-500/40">{s.attempts}x ATTEMPT{s.attempts !== 1 ? 'S' : ''}</p>
                    </div>
                    <div className={`text-[9px] font-mono font-bold px-2 py-1 rounded border flex-shrink-0 ${
                      s.lastOutcome === 'alive'
                        ? 'text-green-400 border-green-500/30 bg-green-500/10'
                        : 'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>
                      {s.lastOutcome === 'alive' ? 'SURVIVED' : 'DECEASED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clear history */}
          <div className="flex justify-end pt-2 border-t border-cyan-500/10">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-[9px] font-mono text-cyan-500/30 hover:text-red-400/60 transition-colors tracking-widest"
              >
                RESET TRAINING DATA
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-red-400/70">Confirm reset all history?</span>
                <button onClick={handleClear} className="text-[9px] font-mono text-red-400 border border-red-500/40 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors">YES, RESET</button>
                <button onClick={() => setConfirmClear(false)} className="text-[9px] font-mono text-cyan-400/60 hover:text-cyan-300 transition-colors">CANCEL</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, color = 'text-cyan-300' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[8px] font-mono text-cyan-500/40 tracking-widest mb-0.5">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
