'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Vapi from '@vapi-ai/web';
import { Scenario } from '@/lib/scenarios';

export interface TranscriptEntry {
  role: 'operator' | 'patient';
  text: string;
  timestamp: string;
}

interface PhoneCallUIProps {
  scenario: Scenario;
  onCallEnd: (transcript: TranscriptEntry[], rawTranscript: string) => void;
}

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default function PhoneCallUI({ scenario, onCallEnd }: PhoneCallUIProps) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(2));
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rawRef = useRef<string>('');

  const startWaveform = useCallback(() => {
    waveIntervalRef.current = setInterval(() => {
      setWaveform(Array(20).fill(0).map(() => Math.random() * 30 + 2));
    }, 100);
  }, []);

  const stopWaveform = useCallback(() => {
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    setWaveform(Array(20).fill(2));
  }, []);

  const startCall = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      alert('VAPI public key not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to .env.local');
      return;
    }

    setStatus('connecting');

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setStatus('active');
      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      startWaveform();
    });

    vapi.on('speech-start', () => startWaveform());
    vapi.on('speech-end', () => stopWaveform());

    vapi.on('message', (msg: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        const role: 'operator' | 'patient' = msg.role === 'user' ? 'operator' : 'patient';
        const entry: TranscriptEntry = {
          role,
          text: msg.transcript || '',
          timestamp: now(),
        };
        setTranscript((prev) => [...prev, entry]);
        rawRef.current += `[${entry.timestamp}] ${role.toUpperCase()}: ${entry.text}\n`;
      }
    });

    vapi.on('call-end', () => {
      setStatus('ended');
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopWaveform();
      onCallEnd(transcript, rawRef.current);
    });

    vapi.on('error', (err: Error) => {
      console.error('VAPI error:', err);
      setStatus('idle');
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopWaveform();
    });

    try {
      // Fetch assistant config from our API
      const res = await fetch('/api/vapi/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id }),
      });
      const { assistantConfig } = await res.json();
      await vapi.start(assistantConfig);
    } catch (err) {
      console.error('Failed to start call:', err);
      setStatus('idle');
    }
  }, [scenario.id, transcript, onCallEnd, startWaveform, stopWaveform]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted((m) => !m);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      vapiRef.current?.stop();
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusConfig = {
    idle: { text: 'STANDBY', color: 'text-cyan-500/60', dot: 'bg-cyan-500/40' },
    connecting: { text: 'CONNECTING...', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
    active: { text: 'CALL ACTIVE', color: 'text-green-400', dot: 'bg-green-400 animate-pulse' },
    ended: { text: 'CALL ENDED', color: 'text-red-400', dot: 'bg-red-400' },
  };

  const st = statusConfig[status];

  return (
    <div className="w-72 h-full flex flex-col glass-panel border-l border-cyan-500/20 z-10">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className={`text-[10px] font-mono tracking-widest ${st.color}`}>{st.text}</span>
        </div>
        <p className="text-cyan-300 font-mono text-xs font-bold">{scenario.callSign}</p>
        <p className="text-cyan-500/50 font-mono text-[9px]">{scenario.title.toUpperCase()} — {scenario.city.toUpperCase()}</p>
      </div>

      {/* Phone display */}
      <div className="p-4 flex flex-col items-center border-b border-cyan-500/20">
        {/* Call timer */}
        <div className={`font-mono text-2xl font-bold mb-3 ${status === 'active' ? 'text-green-400' : 'text-cyan-500/40'}`}>
          {formatDuration(duration)}
        </div>

        {/* Waveform */}
        <div className="flex items-end gap-0.5 h-10 mb-4">
          {waveform.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: h }}
              transition={{ duration: 0.1 }}
              className={`w-1.5 rounded-sm ${status === 'active' ? 'bg-cyan-400' : 'bg-cyan-500/20'}`}
              style={{ minHeight: 2 }}
            />
          ))}
        </div>

        {/* Caller info */}
        <div className="w-full glass-panel rounded border border-cyan-500/20 p-3 text-center mb-4">
          <div className="text-2xl mb-1">
            {scenario.type === 'TRAUMA' ? '🩸' : scenario.type === 'FIRE' ? '🔥' : '💊'}
          </div>
          <p className="text-cyan-300 font-mono text-xs font-bold">{scenario.title.toUpperCase()}</p>
          <p className="text-cyan-500/50 font-mono text-[9px]">INCOMING — {scenario.city.toUpperCase()}</p>
          <div className={`mt-1 text-[8px] font-mono font-bold px-2 py-0.5 rounded inline-block
            ${scenario.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
              scenario.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
            }`}>
            {scenario.severity}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {/* Mute */}
          <button
            onClick={toggleMute}
            disabled={status !== 'active'}
            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-all
              ${isMuted
                ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          {/* Answer / Hang up */}
          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'ended' ? (
              <motion.button
                key="answer"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={startCall}
                className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-400 text-green-400 text-xl flex items-center justify-center hover:bg-green-500/30 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              >
                📞
              </motion.button>
            ) : (
              <motion.button
                key="hangup"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={endCall}
                disabled={status === 'connecting'}
                className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 text-xl flex items-center justify-center hover:bg-red-500/30 transition-all shadow-[0_0_20px_rgba(255,0,64,0.3)] disabled:opacity-50"
              >
                📵
              </motion.button>
            )}
          </AnimatePresence>

          {/* Volume placeholder */}
          <button
            disabled
            className="w-10 h-10 rounded-full border border-cyan-500/20 text-cyan-500/30 flex items-center justify-center text-sm opacity-40 cursor-not-allowed"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Live transcript mini */}
      <div className="flex-1 overflow-hidden p-3">
        <p className="text-[9px] font-mono text-cyan-500/40 mb-2 tracking-widest">LIVE TRANSCRIPT</p>
        <div className="h-full overflow-y-auto space-y-1.5 scrollbar-none">
          {transcript.length === 0 ? (
            <p className="text-[10px] font-mono text-cyan-500/20 text-center mt-4">
              {status === 'idle' ? 'Answer call to begin...' : 'Waiting for speech...'}
            </p>
          ) : (
            transcript.slice(-20).map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-mono"
              >
                <span className={`font-bold ${entry.role === 'operator' ? 'text-cyan-400' : 'text-red-400'}`}>
                  [{entry.role === 'operator' ? 'OP' : 'PT'}]
                </span>
                <span className="text-cyan-300/70 ml-1">{entry.text}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
