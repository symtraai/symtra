'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import TerminalText from './TerminalText';
import type { FeedbackResult } from '@/lib/minimax';
import type { SpeechAnalysis } from '@/lib/speechmatics';

interface FeedbackPlayerProps {
  feedback: FeedbackResult;
  speech: SpeechAnalysis;
  scenarioTitle: string;
  onRetry: () => void;
}

export default function FeedbackPlayer({ feedback, speech, scenarioTitle, onRetry }: FeedbackPlayerProps) {
  const [phase, setPhase] = useState(0);

  const isAlive = feedback.outcome === 'alive';

  return (
    <div className="min-h-screen bg-[#010b14] font-mono text-cyan-300 flex flex-col">
      <div className="scanlines fixed inset-0 pointer-events-none z-0" aria-hidden="true" />

      {/* Top bar */}
      <div className="relative z-10 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between glass-panel">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] tracking-widest text-cyan-500/60">POST-INCIDENT DEBRIEF</span>
        </div>
        <span className="text-[10px] text-cyan-500/40">{scenarioTitle.toUpperCase()}</span>
        <button
          onClick={onRetry}
          className="text-[10px] tracking-widest border border-cyan-500/30 px-3 py-1 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors"
        >
          ← NEW SCENARIO
        </button>
      </div>

      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">

        {/* Outcome badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-[9px] tracking-[0.3em] text-cyan-500/40 mb-1">INCIDENT OUTCOME</p>
            <h1 className={`text-2xl font-bold tracking-wider ${isAlive ? 'text-green-400' : 'text-red-500'}`}>
              {isAlive ? '◉ PATIENT SURVIVED' : '✕ PATIENT DECEASED'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.3em] text-cyan-500/40 mb-1">SCORE</p>
            <p className={`text-4xl font-bold ${feedback.score >= 70 ? 'text-green-400' : feedback.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {feedback.score}<span className="text-lg text-cyan-500/40">/100</span>
            </p>
          </div>
        </motion.div>

        {/* Score bar */}
        <div className="w-full h-1 bg-cyan-500/10 rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${feedback.score}%` }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            className={`h-1 rounded-full ${feedback.score >= 70 ? 'bg-green-400' : feedback.score >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
          />
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel border border-cyan-500/20 rounded p-4"
        >
          <p className="text-[9px] tracking-widest text-cyan-500/50 mb-2">AI EVALUATION SUMMARY</p>
          {phase >= 0 && (
            <TerminalText
              text={feedback.summary}
              speed={20}
              className="text-sm text-cyan-200/80 leading-relaxed"
              onComplete={() => setPhase(1)}
            />
          )}
        </motion.div>

        {/* Good / Bad / Fatal grid */}
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4"
          >
            {/* Good */}
            <div className="glass-panel border border-green-500/20 rounded p-4">
              <p className="text-[9px] tracking-widest text-green-400/60 mb-3">✓ CORRECT ACTIONS</p>
              {feedback.good.length === 0 ? (
                <p className="text-[10px] text-cyan-500/30">None recorded</p>
              ) : (
                <ul className="space-y-1.5">
                  {feedback.good.map((item, i) => (
                    <li key={i} className="text-[10px] text-green-300/80 flex gap-2">
                      <span className="text-green-500 flex-shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bad */}
            <div className="glass-panel border border-yellow-500/20 rounded p-4">
              <p className="text-[9px] tracking-widest text-yellow-400/60 mb-3">⚠ IMPROVEMENTS NEEDED</p>
              {feedback.bad.length === 0 ? (
                <p className="text-[10px] text-cyan-500/30">None recorded</p>
              ) : (
                <ul className="space-y-1.5">
                  {feedback.bad.map((item, i) => (
                    <li key={i} className="text-[10px] text-yellow-300/80 flex gap-2">
                      <span className="text-yellow-500 flex-shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Fatal */}
            <div className="glass-panel border border-red-500/20 rounded p-4">
              <p className="text-[9px] tracking-widest text-red-400/60 mb-3">✕ CRITICAL ERRORS</p>
              {feedback.fatal_errors.length === 0 ? (
                <p className="text-[10px] text-green-400/50">No fatal errors</p>
              ) : (
                <ul className="space-y-1.5">
                  {feedback.fatal_errors.map((item, i) => (
                    <li key={i} className="text-[10px] text-red-300/80 flex gap-2">
                      <span className="text-red-500 flex-shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}

        {/* Speech metrics */}
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel border border-cyan-500/20 rounded p-4"
          >
            <p className="text-[9px] tracking-widest text-cyan-500/50 mb-3">SPEECHMATICS — VOICE ANALYSIS</p>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <Metric label="CLARITY SCORE" value={`${speech.clarity_score}`} unit="/100" color={speech.clarity_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
              <Metric label="SPEECH PACE" value={`${speech.pace_wpm}`} unit="WPM" color="text-cyan-300" />
              <Metric label="HESITATIONS" value={`${speech.hesitations}`} unit="DETECTED" color={speech.hesitations > 5 ? 'text-red-400' : 'text-green-400'} />
              <Metric label="KEY PHRASES" value={`${speech.key_phrases_used.length}`} unit="USED" color="text-cyan-300" />
            </div>

            {speech.recommendations.length > 0 && (
              <div>
                <p className="text-[9px] tracking-widest text-cyan-500/40 mb-2">SPEECH TRAINING RECOMMENDATIONS</p>
                <ul className="space-y-1">
                  {speech.recommendations.map((rec, i) => (
                    <li key={i} className="text-[10px] text-cyan-300/60 flex gap-2">
                      <span className="text-cyan-500">›</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Detailed feedback */}
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel border border-cyan-500/20 rounded p-4"
          >
            <p className="text-[9px] tracking-widest text-cyan-500/50 mb-2">DETAILED TRAINING ASSESSMENT</p>
            <TerminalText
              text={feedback.detailed_feedback}
              speed={12}
              className="text-[11px] text-cyan-300/70 leading-relaxed"
              startDelay={200}
            />
          </motion.div>
        )}

        {/* Retry */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-3 justify-center pb-8"
        >
          <button
            onClick={onRetry}
            className="border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-[11px] tracking-widest px-6 py-2.5 rounded hover:bg-cyan-500/20 transition-colors"
          >
            ← RETURN TO DISPATCH
          </button>
          <button
            onClick={() => {
              const parts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
              const feedbackId = parts[parts.length - 1] || '';
              // feedbackId format: scenarioId-timestamp, extract scenario slug
              const scenarioId = feedbackId.replace(/-\d+$/, '');
              window.location.href = `/simulation/${scenarioId}`;
            }}
            className="border border-red-500/40 bg-red-500/10 text-red-400 text-[11px] tracking-widest px-6 py-2.5 rounded hover:bg-red-500/20 transition-colors"
          >
            ↺ RETRY SCENARIO
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[8px] tracking-widest text-cyan-500/40 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[8px] text-cyan-500/30">{unit}</p>
    </div>
  );
}
