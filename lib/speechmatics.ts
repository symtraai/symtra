// Speechmatics real-time client helper
// Used for post-call transcript analysis and speech quality metrics

export interface SpeechAnalysis {
  clarity_score: number;
  pace_wpm: number;
  hesitations: number;
  key_phrases_used: string[];
  recommendations: string[];
}

export async function getSpeechmaticsToken(): Promise<string> {
  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) throw new Error('Speechmatics API key not configured');

  const response = await fetch('https://mp.speechmatics.com/v1/api_keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ttl: 3600 }),
  });

  if (!response.ok) {
    throw new Error(`Speechmatics token error: ${response.status}`);
  }

  const data = await response.json();
  return data.key_value as string;
}

export function analyzeSpeechMetrics(transcript: string): SpeechAnalysis {
  const words = transcript.split(/\s+/).filter(Boolean);
  const hesitationWords = ['um', 'uh', 'er', 'ah', 'like', 'you know'];
  const hesitations = words.filter((w) =>
    hesitationWords.includes(w.toLowerCase())
  ).length;

  const emergencyPhrases = [
    'stay calm',
    'apply pressure',
    'do not move',
    'help is on the way',
    'ambulance is coming',
    'keep breathing',
    'cpr',
    'recovery position',
    'what is your location',
    'what is your address',
  ];

  const lowerTranscript = transcript.toLowerCase();
  const key_phrases_used = emergencyPhrases.filter((p) =>
    lowerTranscript.includes(p)
  );

  // Estimate WPM assuming ~2min call
  const pace_wpm = Math.round(words.length / 2);

  const clarity_score = Math.min(
    100,
    Math.max(
      0,
      100 - hesitations * 5 + key_phrases_used.length * 8
    )
  );

  const recommendations: string[] = [];
  if (hesitations > 5) recommendations.push('Reduce filler words (um, uh) to sound more confident');
  if (pace_wpm > 150) recommendations.push('Slow down your speech — clarity is critical in emergencies');
  if (pace_wpm < 80) recommendations.push('Speak more efficiently — time is critical in emergencies');
  if (!key_phrases_used.includes('what is your location') && !key_phrases_used.includes('what is your address')) {
    recommendations.push('Always confirm the caller\'s exact location early in the call');
  }
  if (!key_phrases_used.includes('help is on the way') && !key_phrases_used.includes('ambulance is coming')) {
    recommendations.push('Always confirm that emergency services are en route to reassure the caller');
  }

  return { clarity_score, pace_wpm, hesitations, key_phrases_used, recommendations };
}
