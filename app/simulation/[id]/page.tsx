'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getScenario } from '@/lib/scenarios';
import { analyzeSpeechMetrics } from '@/lib/speechmatics';
import PhoneCallUI, { TranscriptEntry } from '@/components/PhoneCallUI';
import ScanlineOverlay from '@/components/ScanlineOverlay';
import OutcomeScreen from '@/components/OutcomeScreen';
import type { FeedbackResult } from '@/lib/minimax';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

interface PageProps {
  params: Promise<{ id: string }>;
}

type AppState =
  | { phase: 'call' }
  | { phase: 'processing' }
  | { phase: 'outcome'; outcome: 'alive' | 'dead'; score: number; feedbackId: string };

export default function SimulationPage({ params }: PageProps) {
  const { id } = use(params);
  const scenario = getScenario(id);

  const [appState, setAppState] = useState<AppState>({ phase: 'call' });
  const [transcriptData, setTranscriptData] = useState<TranscriptEntry[]>([]);

  // All hooks must be called unconditionally before any early return
  const handleCallEnd = useCallback(
    async (transcript: TranscriptEntry[], rawTranscript: string) => {
      setTranscriptData(transcript);
      setAppState({ phase: 'processing' });

      const title = scenario?.title ?? 'Unknown';

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: id, transcript: rawTranscript }),
        });

        const { feedback, speechAnalysis } = (await res.json()) as {
          feedback: FeedbackResult;
          speechAnalysis: ReturnType<typeof analyzeSpeechMetrics>;
        };

        sessionStorage.setItem(
          `feedback-${id}`,
          JSON.stringify({ feedback, speechAnalysis, rawTranscript, scenarioTitle: title })
        );

        const feedbackId = `${id}-${Date.now()}`;
        setAppState({
          phase: 'outcome',
          outcome: feedback.outcome,
          score: feedback.score,
          feedbackId,
        });
      } catch (err) {
        console.error('Failed to generate feedback:', err);
        const speechAnalysis = analyzeSpeechMetrics(rawTranscript);
        const fallbackFeedback: FeedbackResult = {
          outcome: 'alive',
          score: 60,
          good: ['Completed the call'],
          bad: ['Unable to fully analyze — check API configuration'],
          fatal_errors: [],
          summary: 'Evaluation could not be completed. Review your MiniMax API key.',
          detailed_feedback: 'Please configure your MINIMAX_API_KEY to receive detailed AI-powered feedback.',
        };

        const feedbackId = `${id}-${Date.now()}`;
        sessionStorage.setItem(
          `feedback-${id}`,
          JSON.stringify({ feedback: fallbackFeedback, speechAnalysis, rawTranscript, scenarioTitle: title })
        );

        setAppState({ phase: 'outcome', outcome: 'alive', score: 60, feedbackId });
      }
    },
    [id, scenario]
  );

  // Dev helper: trigger debrief with a mock transcript (no real VAPI call needed)
  const triggerTestDebrief = useCallback(async () => {
    const mockRaw = [
      '[12:00:01] PATIENT: Help! I\'ve been shot, I\'m in Central Park near the fountain!',
      '[12:00:05] OPERATOR: Okay stay calm. Where are you exactly?',
      '[12:00:08] PATIENT: Central Park, by the big fountain, please hurry I\'m bleeding bad',
      '[12:00:12] OPERATOR: I\'m sending help right now. Can you apply pressure to the wound?',
      '[12:00:17] PATIENT: Yes... okay I\'m pressing on it',
      '[12:00:20] OPERATOR: Keep pressing hard. Don\'t remove your hand. Help is on the way, stay with me.',
    ].join('\n');
    const mockEntries: TranscriptEntry[] = [
      { role: 'patient', text: "Help! I've been shot, I'm in Central Park near the fountain!", timestamp: '12:00:01' },
      { role: 'operator', text: 'Okay stay calm. Where are you exactly?', timestamp: '12:00:05' },
      { role: 'patient', text: "Central Park, by the big fountain, please hurry I'm bleeding bad", timestamp: '12:00:08' },
      { role: 'operator', text: "I'm sending help right now. Can you apply pressure to the wound?", timestamp: '12:00:12' },
      { role: 'patient', text: "Yes... okay I'm pressing on it", timestamp: '12:00:17' },
      { role: 'operator', text: "Keep pressing hard. Don't remove your hand. Help is on the way.", timestamp: '12:00:20' },
    ];
    await handleCallEnd(mockEntries, mockRaw);
  }, [handleCallEnd]);

  if (!scenario) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#010b14] font-mono text-red-400">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">SCENARIO NOT FOUND</p>
          <p className="text-sm text-cyan-500/50 mb-4">ID: {id}</p>
          <Link href="/" className="text-cyan-400 underline text-sm">← RETURN TO DISPATCH</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#010b14] relative">
      <ScanlineOverlay />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-8 z-20 glass-panel border-b border-cyan-500/20 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[9px] font-mono text-cyan-500/50 hover:text-cyan-300 transition-colors">
            ← DISPATCH
          </Link>
          <span className="text-[9px] font-mono text-cyan-500/30">|</span>
          <span className="text-[9px] font-mono tracking-widest text-red-400 animate-pulse">● SIMULATION ACTIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-cyan-500/50">
            {scenario.code} — {scenario.title.toUpperCase()} — {scenario.city.toUpperCase()}
          </span>
          {appState.phase === 'call' && (
            <button
              onClick={triggerTestDebrief}
              className="text-[8px] font-mono border border-yellow-500/30 text-yellow-500/60 px-2 py-0.5 rounded hover:border-yellow-500/60 hover:text-yellow-400 transition-colors"
            >
              [TEST DEBRIEF]
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex w-full h-full pt-8">
        {/* Left: Live Transcript panel */}
        <div className="w-72 glass-panel border-r border-cyan-500/20 flex flex-col">
          <div className="p-4 border-b border-cyan-500/20">
            <p className="text-[9px] font-mono tracking-widest text-cyan-500/50 mb-1">CALL TRANSCRIPT</p>
            <p className="text-xs font-mono text-cyan-300 font-bold">{scenario.title.toUpperCase()}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
            {transcriptData.length === 0 ? (
              <p className="text-[10px] font-mono text-cyan-500/20 text-center mt-8">
                Transcript will appear here...
              </p>
            ) : (
              transcriptData.map((entry, i) => (
                <div
                  key={i}
                  className={`text-[10px] font-mono rounded p-2 ${
                    entry.role === 'operator'
                      ? 'bg-cyan-500/5 border-l-2 border-cyan-500/40'
                      : 'bg-red-500/5 border-l-2 border-red-500/40'
                  }`}
                >
                  <div className="flex justify-between mb-0.5">
                    <span
                      className={`font-bold text-[8px] tracking-widest ${
                        entry.role === 'operator' ? 'text-cyan-400' : 'text-red-400'
                      }`}
                    >
                      {entry.role === 'operator' ? '[OPERATOR]' : '[PATIENT]'}
                    </span>
                    <span className="text-cyan-500/30 text-[8px]">{entry.timestamp}</span>
                  </div>
                  <p className="text-cyan-200/70">{entry.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Map zoomed to scenario */}
        <div className="flex-1 relative">
          <WorldMap selectedScenario={scenario} onScenarioSelect={() => {}} />

          {appState.phase === 'processing' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <div className="text-center font-mono">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyan-300 text-sm tracking-widest">ANALYZING CALL...</p>
                <p className="text-cyan-500/50 text-[10px] mt-1">MiniMax M.25 evaluating performance</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Phone Call UI */}
        <PhoneCallUI scenario={scenario} onCallEnd={handleCallEnd} />
      </div>

      {appState.phase === 'outcome' && (
        <OutcomeScreen
          outcome={appState.outcome}
          score={appState.score}
          scenarioId={id}
          feedbackId={appState.feedbackId}
        />
      )}
    </div>
  );
}
