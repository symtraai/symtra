import { NextRequest, NextResponse } from 'next/server';
import { generateFeedback } from '@/lib/minimax';
import { analyzeSpeechMetrics } from '@/lib/speechmatics';
import { getScenario } from '@/lib/scenarios';

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, transcript } = await req.json();

    if (!scenarioId || !transcript) {
      return NextResponse.json({ error: 'Missing scenarioId or transcript' }, { status: 400 });
    }

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Run both analyses in parallel
    const [feedback, speechAnalysis] = await Promise.all([
      generateFeedback(transcript, scenario.title),
      Promise.resolve(analyzeSpeechMetrics(transcript)),
    ]);

    return NextResponse.json({ feedback, speechAnalysis });
  } catch (err) {
    console.error('Feedback generation error:', err);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}
