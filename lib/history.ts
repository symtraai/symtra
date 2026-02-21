const HISTORY_KEY = 'symtra_history';

export interface HistoryEntry {
  scenarioId: string;
  scenarioTitle: string;
  scenarioType: string;
  city: string;
  score: number;
  outcome: 'alive' | 'dead';
  good: string[];
  bad: string[];
  fatal_errors: string[];
  date: string;
}

export function saveToHistory(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return;
  const existing = getHistory();
  // Keep most recent 50 entries
  const updated = [entry, ...existing].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export interface ReadinessReport {
  overallScore: number;
  tier: 'ROOKIE' | 'TRAINEE' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT';
  tierColor: string;
  totalAttempts: number;
  survivedCount: number;
  survivalRate: number;
  scenarioBreakdown: { id: string; title: string; city: string; type: string; bestScore: number; attempts: number; lastOutcome: 'alive' | 'dead' }[];
  topStrengths: string[];
  topWeaknesses: string[];
  fatalMistakes: string[];
  recommendation: string;
}

export function computeReadiness(history: HistoryEntry[]): ReadinessReport {
  if (history.length === 0) {
    return {
      overallScore: 0,
      tier: 'ROOKIE',
      tierColor: 'text-red-400',
      totalAttempts: 0,
      survivedCount: 0,
      survivalRate: 0,
      scenarioBreakdown: [],
      topStrengths: [],
      topWeaknesses: [],
      fatalMistakes: [],
      recommendation: 'No simulations completed yet. Select an incident from the map to begin training.',
    };
  }

  const overallScore = Math.round(history.reduce((sum, e) => sum + e.score, 0) / history.length);
  const survivedCount = history.filter((e) => e.outcome === 'alive').length;
  const survivalRate = Math.round((survivedCount / history.length) * 100);

  // Per-scenario breakdown (best score per scenario)
  const byScenario = new Map<string, HistoryEntry[]>();
  for (const entry of history) {
    const existing = byScenario.get(entry.scenarioId) ?? [];
    byScenario.set(entry.scenarioId, [...existing, entry]);
  }
  const scenarioBreakdown = Array.from(byScenario.entries()).map(([id, entries]) => ({
    id,
    title: entries[0].scenarioTitle,
    city: entries[0].city,
    type: entries[0].scenarioType,
    bestScore: Math.max(...entries.map((e) => e.score)),
    attempts: entries.length,
    lastOutcome: entries[0].outcome,
  }));

  // Aggregate good/bad/fatal across all sessions
  const allGood = history.flatMap((e) => e.good);
  const allBad = history.flatMap((e) => e.bad);
  const allFatal = history.flatMap((e) => e.fatal_errors);

  const topStrengths = topN(allGood, 4);
  const topWeaknesses = topN(allBad, 4);
  const fatalMistakes = [...new Set(allFatal)].slice(0, 3);

  const tier =
    overallScore >= 90 ? 'EXPERT'
    : overallScore >= 75 ? 'PROFICIENT'
    : overallScore >= 55 ? 'COMPETENT'
    : overallScore >= 35 ? 'TRAINEE'
    : 'ROOKIE';

  const tierColor =
    tier === 'EXPERT' ? 'text-cyan-300'
    : tier === 'PROFICIENT' ? 'text-green-400'
    : tier === 'COMPETENT' ? 'text-yellow-400'
    : tier === 'TRAINEE' ? 'text-orange-400'
    : 'text-red-400';

  const recommendation =
    fatalMistakes.length > 0
      ? `PRIORITY: Eliminate fatal errors — you gave dangerous advice in ${fatalMistakes.length} session(s). This must be corrected before field deployment.`
      : topWeaknesses.length > 0
      ? `Focus area: "${topWeaknesses[0]}" — this was your most consistent gap. Practice until it becomes automatic in the first 15 seconds of a call.`
      : overallScore >= 80
      ? 'Strong performance. Continue drilling edge-case scenarios to reach Expert level.'
      : 'Keep practicing. Aim for consistent location confirmation and reassurance in every call.';

  return {
    overallScore,
    tier,
    tierColor,
    totalAttempts: history.length,
    survivedCount,
    survivalRate,
    scenarioBreakdown,
    topStrengths,
    topWeaknesses,
    fatalMistakes,
    recommendation,
  };
}

function topN(items: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([item]) => item);
}
