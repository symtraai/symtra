'use client';

import { getHistory } from '@/lib/history';

export default function ReadinessBadge() {
  const count = getHistory().length;
  if (count === 0) return null;
  return (
    <span className="ml-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[8px] px-1 rounded">
      {count}
    </span>
  );
}
