'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FeedbackPlayer from '@/components/FeedbackPlayer';
import type { FeedbackResult } from '@/lib/minimax';
import type { SpeechAnalysis } from '@/lib/speechmatics';

interface StoredFeedback {
  feedback: FeedbackResult;
  speechAnalysis: SpeechAnalysis;
  rawTranscript: string;
  scenarioTitle: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FeedbackPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<StoredFeedback | null>(null);
  const [error, setError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const parts = id.split('-');
    let stored: string | null = null;
    for (let i = parts.length; i > 0; i--) {
      const key = parts.slice(0, i).join('-');
      stored = sessionStorage.getItem(`feedback-${key}`);
      if (stored) break;
    }

    const frame = requestAnimationFrame(() => {
      if (!stored) {
        setError(true);
        return;
      }
      try {
        setData(JSON.parse(stored) as StoredFeedback);
      } catch {
        setError(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [id]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#010b14] font-mono text-red-400">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">DEBRIEF DATA NOT FOUND</p>
          <p className="text-sm text-cyan-500/50 mb-4">Session may have expired or you navigated here directly.</p>
          <Link href="/" className="text-cyan-400 underline text-sm">← RETURN TO DISPATCH</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#010b14] font-mono">
        <div className="text-center text-cyan-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm tracking-widest">LOADING DEBRIEF...</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackPlayer
      feedback={data.feedback}
      speech={data.speechAnalysis}
      scenarioTitle={data.scenarioTitle}
      onRetry={() => router.push('/')}
    />
  );
}
