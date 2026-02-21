import { Scenario } from './scenarios';

// The base URL where VAPI can reach our server.
// In dev this needs to be a public URL (via ngrok or similar).
// In production set NEXT_PUBLIC_APP_URL to your domain.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export function buildVapiAssistantConfig(scenario: Scenario) {
  return {
    name: `911-Patient-${scenario.id}`,
    firstMessage: getOpeningLine(scenario),
    model: {
      provider: 'custom-llm',
      url: `${APP_URL}/api/vapi/llm`,
      // Dummy key — auth handled server-side in our proxy
      customLlmExtraParams: {},
      model: 'abab6.5s-chat',
      messages: [
        {
          role: 'system' as const,
          content: scenario.patientPrompt,
        },
      ],
      temperature: 0.8,
      maxTokens: 400,
    },
    voice: {
      provider: '11labs' as const,
      voiceId: getElevenLabsVoice(scenario),
    },
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2',
      language: 'en-US',
    },
    endCallFunctionEnabled: false,
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
  return lines[scenario.id] || 'Please help me, I need emergency services!';
}

function getElevenLabsVoice(scenario: Scenario): string {
  // ElevenLabs voices — works with VAPI's built-in ElevenLabs integration
  const voices: Record<string, string> = {
    'gsw-nyc': 'pNInz6obpgDQGcFmaJgB',    // Adam — male, distressed
    'cardiac-lon': 'EXAVITQu4vr4xnSDxMaL', // Bella — calm bystander
    'fire-tky': 'MF3mGyEYCl7XYWbV9V6O',   // Elli — scared female
    'accident-syd': 'TxGEqnHWrfWFTfGW9XjX', // Josh — Australian male
    'drowning-mia': 'EXAVITQu4vr4xnSDxMaL', // Bella — panicked mother
    'overdose-la': 'pNInz6obpgDQGcFmaJgB',  // Adam — scared young male
  };
  return voices[scenario.id] || 'pNInz6obpgDQGcFmaJgB';
}
