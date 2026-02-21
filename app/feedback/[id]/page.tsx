'use client';

import { use } from 'react';
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

function readFeedback(id: string): StoredFeedback | null {
  if (typeof window === 'undefined') return null;
  const parts = id.split('-');
  for (let i = parts.length; i > 0; i--) {
    const key = parts.slice(0, i).join('-');
    const raw = sessionStorage.getItem(`feedback-${key}`);
    if (raw) {
      try { return JSON.parse(raw) as StoredFeedback; } catch { return null; }
    }
  }
  return null;
}

export default function FeedbackPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const data = readFeedback(id);

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#010b14] font-mono text-red-400">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">DEBRIEF DATA NOT FOUND</p>
          <p className="text-sm text-cyan-500/50 mb-4">Session expired or you navigated here directly.</p>
          <Link href="/" className="text-cyan-400 underline text-sm">← RETURN TO DISPATCH</Link>
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
