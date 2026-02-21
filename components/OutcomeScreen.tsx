'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface OutcomeScreenProps {
  outcome: 'alive' | 'dead';
  score: number;
  scenarioId?: string;
  feedbackId: string;
}

export default function OutcomeScreen({ outcome, score, feedbackId }: OutcomeScreenProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const isAlive = outcome === 'alive';

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.push(`/feedback/${feedbackId}`);
    }
  }, [countdown, feedbackId, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: isAlive ? 'rgba(0,12,20,0.97)' : 'rgba(20,0,0,0.97)' }}
    >
      <ScanlineOverlay />

      <div className="text-center font-mono max-w-lg px-8">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.6, ease: 'backOut' }}
          className="text-8xl mb-6"
        >
          {isAlive ? '💚' : '💀'}
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`text-[10px] tracking-[0.4em] mb-2 ${isAlive ? 'text-green-400/60' : 'text-red-400/60'}`}>
            {isAlive ? '— PATIENT STATUS —' : '— INCIDENT REPORT —'}
          </div>

          <h1
            className={`text-4xl font-bold tracking-wider mb-2 ${
              isAlive
                ? 'text-green-400 [text-shadow:0_0_30px_rgba(34,197,94,0.6)]'
                : 'text-red-500 [text-shadow:0_0_30px_rgba(255,0,64,0.6)]'
            }`}
          >
            {isAlive ? 'PATIENT STABILIZED' : 'SUBJECT DECEASED'}
          </h1>

          <p className={`text-sm tracking-widest mb-8 ${isAlive ? 'text-green-400/50' : 'text-red-400/50'}`}>
            {isAlive ? 'UNIT RESPONDED IN TIME' : 'CODE 4 — CALL TERMINATED'}
          </p>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className={`inline-block border rounded-lg px-8 py-4 mb-8 ${
            isAlive ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'
          }`}
        >
          <div className="text-[9px] tracking-widest text-cyan-500/50 mb-1">OPERATOR SCORE</div>
          <div className={`text-5xl font-bold ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score}
          </div>
          <div className="text-[9px] tracking-widest text-cyan-500/50 mt-1">/ 100</div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full bg-cyan-500/10 rounded-full h-1 mb-4"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 1.4, duration: 1.2, ease: 'easeOut' }}
            className={`h-1 rounded-full ${score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
          />
        </motion.div>

        {/* Redirect countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-[11px] text-cyan-500/40 tracking-widest"
        >
          REDIRECTING TO DEBRIEF IN {countdown}s...
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          onClick={() => router.push(`/feedback/${feedbackId}`)}
          className="mt-4 text-[10px] text-cyan-400/60 hover:text-cyan-300 transition-colors tracking-widest underline underline-offset-4"
        >
          SKIP TO DEBRIEF →
        </motion.button>
      </div>
    </motion.div>
  );
}

function ScanlineOverlay() {
  return <div className="scanlines fixed inset-0 pointer-events-none z-0" aria-hidden="true" />;
}
