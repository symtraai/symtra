import { Scenario } from './scenarios';

export function buildVapiAssistantConfig(scenario: Scenario) {
  return {
    name: `911-Patient-${scenario.id}`,
    firstMessage: getOpeningLine(scenario),
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system' as const,
          content: scenario.patientPrompt,
        },
      ],
      temperature: 0.8,
    },
    voice: {
      provider: 'openai' as const,
      voiceId: getVoiceId(scenario),
    },
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'en-US',
    },
    endCallFunctionEnabled: true,
    endCallMessage: 'Call terminated.',
    maxDurationSeconds: 300,
  };
}

function getOpeningLine(scenario: Scenario): string {
  const lines: Record<string, string> = {
    'gsw-nyc': "Help... I've been shot... oh god... Central Park... please hurry...",
    'cardiac-lon': "Hello?! Yes, please, this woman collapsed, she's not moving, I don't know what to do!",
    'fire-tky': "Please help me! There's fire... I'm on the fourth floor... so much smoke...",
    'accident-syd': "Yeah hi, I need help, I'm on the Harbour Bridge, there's been a crash, my mate is knocked out...",
    'drowning-mia': "MY SON! He was in the pool! He's not breathing! PLEASE HELP ME!",
    'overdose-la': "Hi yeah I need an ambulance, my roommate... I can't wake them up... I'm really scared...",
  };
  return lines[scenario.id] || "Please help me, I need 911...";
}

function getVoiceId(scenario: Scenario): string {
  const voices: Record<string, string> = {
    'gsw-nyc': 'alloy',
    'cardiac-lon': 'echo',
    'fire-tky': 'nova',
    'accident-syd': 'fable',
    'drowning-mia': 'shimmer',
    'overdose-la': 'onyx',
  };
  return voices[scenario.id] || 'alloy';
}

export function parseEvaluationFromTranscript(transcript: string) {
  const match = transcript.match(/EVALUATION_JSON:(\{[\s\S]*?\})/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  return null;
}
