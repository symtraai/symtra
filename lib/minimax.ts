export interface FeedbackResult {
  outcome: 'alive' | 'dead';
  score: number;
  good: string[];
  bad: string[];
  fatal_errors: string[];
  summary: string;
  detailed_feedback: string;
}

export async function generateFeedback(
  transcript: string,
  scenarioTitle: string
): Promise<FeedbackResult> {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return localFallback(transcript, scenarioTitle);
  }

  const effectiveTranscript = transcript.trim() || '[No speech captured]';

  const prompt = `You are an expert 911 dispatcher training evaluator. Analyze this 911 call training transcript.

SCENARIO: ${scenarioTitle}
TRANSCRIPT:
${effectiveTranscript}

Evaluate the operator (not the patient). Did they:
- Get the exact location?
- Give correct emergency first aid instructions?
- Keep the caller calm?
- Confirm help is coming?
- Make any dangerous mistakes?

Reply ONLY with this JSON, nothing else:
{
  "outcome": "alive",
  "score": 75,
  "good": ["thing done well", "another good action"],
  "bad": ["thing to improve", "missed step"],
  "fatal_errors": [],
  "summary": "2-3 sentence evaluation.",
  "detailed_feedback": "Detailed training paragraph for the operator."
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: 'You are a 911 training evaluator. Reply with JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('MiniMax error:', response.status, await response.text());
      return localFallback(transcript, scenarioTitle);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';

    if (!content) return localFallback(transcript, scenarioTitle);

    // Strip markdown fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as FeedbackResult;
    }

    return localFallback(transcript, scenarioTitle);
  } catch (err) {
    console.error('MiniMax fetch failed:', err);
    return localFallback(transcript, scenarioTitle);
  }
}

// Fast local fallback — analyzes transcript without any API call
function localFallback(transcript: string, scenarioTitle: string): FeedbackResult {
  const t = transcript.toLowerCase();

  const good: string[] = [];
  const bad: string[] = [];
  const fatal_errors: string[] = [];

  // Check for key operator behaviors
  if (/where are you|what('s| is) your (address|location)|location/.test(t)) good.push('Asked for the caller\'s location');
  else bad.push('Did not ask for exact location early in the call');

  if (/stay calm|breathe|i('m| am) here|help is (on the way|coming)/.test(t)) good.push('Reassured the caller');
  else bad.push('Did not reassure the caller that help is coming');

  if (/press|pressure|apply|hold/.test(t)) good.push('Gave wound pressure instructions');

  if (/cpr|chest compression|breathe for/.test(t)) good.push('Instructed CPR');

  if (/don'?t move|do not move|stay still/.test(t)) good.push('Told caller not to move victim');

  if (/remove the bullet|pull it out|give (them |him |her )?water|slap|wake them/.test(t)) {
    fatal_errors.push('Gave dangerous incorrect medical advice');
  }

  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const hasContent = wordCount > 10;

  const score = Math.min(
    100,
    Math.max(0, 40 + good.length * 12 - fatal_errors.length * 30 - bad.length * 5)
  );

  const outcome: 'alive' | 'dead' = fatal_errors.length > 0 || score < 30 ? 'dead' : 'alive';

  return {
    outcome,
    score,
    good: good.length > 0 ? good : ['Engaged with the caller'],
    bad: bad.length > 0 ? bad : ['Review standard emergency protocols'],
    fatal_errors,
    summary: hasContent
      ? `Your call for the ${scenarioTitle} scenario scored ${score}/100. ${fatal_errors.length > 0 ? 'Critical errors were detected that endangered the patient.' : score >= 70 ? 'Good performance overall.' : 'Several key steps were missed.'}`
      : `No transcript captured for ${scenarioTitle}. Ensure your microphone is enabled and VAPI is connected.`,
    detailed_feedback: hasContent
      ? `During this ${scenarioTitle} training call, you demonstrated ${good.length} correct actions and ${bad.length} areas for improvement. ${fatal_errors.length > 0 ? `CRITICAL: You gave dangerous advice (${fatal_errors.join(', ')}) which would likely result in patient death in a real scenario.` : ''} Focus on the first 15 seconds: always get location, confirm ambulance is coming, then give clear first-aid instructions. Speak slowly and clearly — panicked callers need simple, direct commands.`
      : 'Connect your microphone and complete a full call to receive detailed feedback.',
  };
}
