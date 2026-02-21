'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';

// This page is a fallback — outcomes are handled inline on simulation page
// Redirect back to home
export default function OutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  if (typeof window !== 'undefined') {
    router.replace(`/simulation/${id}`);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#010b14] font-mono text-cyan-400">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
