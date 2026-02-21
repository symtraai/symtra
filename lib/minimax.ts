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
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey || !groupId) {
    throw new Error('MiniMax API credentials not configured');
  }

  const prompt = `You are an expert 911 dispatcher training evaluator. Analyze this transcript of a 911 training simulation for scenario: "${scenarioTitle}".

TRANSCRIPT:
${transcript}

Evaluate the operator's performance and respond ONLY with valid JSON in this exact format:
{
  "outcome": "alive" or "dead",
  "score": number from 0-100,
  "good": ["list of things done correctly"],
  "bad": ["list of things that could be improved"],
  "fatal_errors": ["list of dangerous mistakes that could kill the patient"],
  "summary": "2-3 sentence overall summary",
  "detailed_feedback": "Detailed paragraph of training feedback for the operator"
}`;

  const response = await fetch(
    `https://api.minimax.io/v1/text/chatcompletion_v2?GroupId=${groupId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as FeedbackResult;
    }
  } catch {
    // fallback
  }

  return {
    outcome: 'alive',
    score: 50,
    good: ['Completed the call'],
    bad: ['Could not fully analyze transcript'],
    fatal_errors: [],
    summary: 'Evaluation incomplete. Review transcript manually.',
    detailed_feedback: content,
  };
}
