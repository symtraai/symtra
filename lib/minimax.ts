export interface FeedbackResult {
  outcome: 'alive' | 'dead';
  score: number;
  good: string[];
  bad: string[];
  fatal_errors: string[];
  summary: string;
  detailed_feedback: string;
}

// Critical steps per scenario — ALL must be done or patient dies
const SCENARIO_CRITERIA: Record<string, {
  critical: { label: string; patterns: RegExp }[];
  fatal: { label: string; patterns: RegExp }[];
}> = {
  'gsw-nyc': {
    critical: [
      { label: 'Asked for exact location', patterns: /where are you|location|address|central park|where('?re| are) you/ },
      { label: 'Told caller to apply direct pressure to wound', patterns: /press|pressure|apply|hold.*wound|cloth|hand on/ },
      { label: 'Confirmed ambulance is on the way', patterns: /help is (coming|on the way)|ambulance|sending|dispatch(ed|ing)|unit(s)? en route/ },
      { label: 'Kept caller conscious and calm', patterns: /stay (with me|awake|conscious)|keep talking|don'?t (fall asleep|pass out)|stay calm|breathe/ },
    ],
    fatal: [
      { label: 'Told caller to remove or pull out bullet — FATAL', patterns: /remove.*bullet|pull.*bullet|pull it out|take.*bullet out/ },
      { label: 'Told caller to sit or stand up — worsens blood loss', patterns: /sit up|stand up|get up/ },
      { label: 'Told caller to run or move — FATAL blood loss risk', patterns: /run|walk to|move (to|toward|towards)/ },
    ],
  },
  'cardiac-lon': {
    critical: [
      { label: 'Asked for exact location', patterns: /where|location|address|covent|street/ },
      { label: 'Instructed caller to start CPR', patterns: /cpr|chest compression|pump|push.*chest|compress/ },
      { label: 'Asked if patient is breathing', patterns: /breathing|breath|breathe|responsive|responding|conscious/ },
      { label: 'Confirmed ambulance is coming', patterns: /help is (coming|on the way)|ambulance|sending|dispatch/ },
    ],
    fatal: [
      { label: 'Told caller to move the unconscious patient — spinal risk', patterns: /move her|move them|drag|lift.*up|carry/ },
      { label: 'Told caller to give patient food or water — aspiration risk', patterns: /give.*water|give.*drink|give.*food|feed/ },
      { label: 'Told caller to slap or shake patient to wake them', patterns: /slap|shake.*wake|wake.*slap/ },
    ],
  },
  'fire-tky': {
    critical: [
      { label: 'Got exact address and floor number', patterns: /address|floor|where|shinjuku|building|room/ },
      { label: 'Told caller to stay low below the smoke', patterns: /stay low|get low|crawl|below.*smoke|under.*smoke/ },
      { label: 'Told caller not to use the elevator', patterns: /elevator|don'?t.*elevator|stairs|no elevator/ },
      { label: 'Confirmed fire services are coming', patterns: /fire.*coming|help.*way|sending|dispatch|firefighter/ },
    ],
    fatal: [
      { label: 'Told caller to open window and jump from 4th floor — FATAL', patterns: /jump|open.*window.*jump|jump.*window/ },
      { label: 'Told caller to run through smoke without covering mouth', patterns: /run through|just run|go through the smoke/ },
    ],
  },
  'accident-syd': {
    critical: [
      { label: 'Got exact location (Harbour Bridge)', patterns: /where|location|address|harbour|bridge|street/ },
      { label: 'Asked how many people are injured', patterns: /how many|number of|anyone else|other (people|passengers|injured)/ },
      { label: 'Told caller NOT to move the unconscious passenger', patterns: /don'?t move|do not move|leave.*there|stay still|spinal/ },
      { label: 'Confirmed emergency services are coming', patterns: /help.*coming|way|sending|dispatch|ambulance|police/ },
    ],
    fatal: [
      { label: 'Told caller to move the unconscious person — spinal injury risk', patterns: /move.*him|move.*her|move.*them|pull.*out|drag.*out/ },
      { label: 'Told caller to leave the scene', patterns: /leave|get away|drive away|abandon/ },
    ],
  },
  'drowning-mia': {
    critical: [
      { label: 'Got the address of the home', patterns: /address|where (are you|is this)|location|street/ },
      { label: 'Instructed caller to start rescue breathing or CPR', patterns: /cpr|breathe for|rescue breath|compression|pump|tilt.*head|mouth to mouth/ },
      { label: 'Kept caller calm enough to take action', patterns: /stay calm|breathe|listen to me|you can do this|follow|i('m| am) here/ },
      { label: 'Confirmed ambulance is on the way', patterns: /help.*coming|on the way|sending|dispatch|ambulance/ },
    ],
    fatal: [
      { label: 'Told caller to put child back in water', patterns: /back.*water|put.*in.*water|water.*again/ },
      { label: 'Told caller to give food or drink to unresponsive child', patterns: /give.*water|give.*drink|pour/ },
    ],
  },
  'overdose-la': {
    critical: [
      { label: 'Got the address', patterns: /address|where (are you|is this)|location|street|hollywood/ },
      { label: 'Asked what substance was taken', patterns: /what.*took|what.*take|drug|substance|fentanyl|pills|what.*swallow/ },
      { label: 'Asked if patient is breathing', patterns: /breathing|breath|breathe|responsive|unconscious|awake/ },
      { label: 'Confirmed ambulance is coming', patterns: /help.*coming|on the way|sending|dispatch|ambulance/ },
    ],
    fatal: [
      { label: 'Told caller to leave the scene — deters help and abandons patient', patterns: /leave|get out of there|run|leave.*scene/ },
      { label: 'Threatened caller about drugs — discourages future calls', patterns: /trouble|arrest|call.*police on|report you|get in trouble/ },
    ],
  },
};

export async function generateFeedback(
  transcript: string,
  scenarioTitle: string,
  scenarioId: string
): Promise<FeedbackResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey) {
    return localEvaluate(transcript, scenarioTitle, scenarioId);
  }

  const effectiveTranscript = transcript.trim() || '[No speech captured]';

  const criteria = SCENARIO_CRITERIA[scenarioId];
  const criticalSteps = criteria
    ? criteria.critical.map((c, i) => `${i + 1}. ${c.label}`).join('\n')
    : 'Ask location, give first aid, confirm help coming, keep calm';

  const prompt = `You are a strict 911 dispatcher training evaluator. Analyze ONLY the OPERATOR's lines in this transcript.

SCENARIO: ${scenarioTitle}
CRITICAL STEPS THE OPERATOR MUST COMPLETE:
${criticalSteps}

TRANSCRIPT:
${effectiveTranscript}

Rules:
- If ANY critical step is completely missing, set outcome to "dead"
- Score starts at 100, subtract 20 per missed critical step, subtract 40 per fatal error
- Be very specific — name exactly what the operator said or failed to say
- fatal_errors are things the operator said that would kill or harm the patient

Respond ONLY with valid JSON:
{
  "outcome": "alive",
  "score": 75,
  "good": ["specific action operator took"],
  "bad": ["specific critical step that was completely missed"],
  "fatal_errors": ["dangerous thing the operator said"],
  "summary": "2-3 sentences. Be blunt about what killed the patient if outcome is dead.",
  "detailed_feedback": "Specific paragraph. Quote the operator's words where relevant. Name exact steps missed."
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Try GroupId endpoint (primary MiniMax format)
    const url = groupId
      ? `https://api.minimax.io/v1/text/chatcompletion_v2?GroupId=${groupId}`
      : 'https://api.minimax.io/v1/chat/completions';

    const body = groupId
      ? {
          model: 'abab6.5s-chat',
          messages: [
            { sender_type: 'SYSTEM', sender_name: 'system', text: 'You are a 911 training evaluator. Reply with JSON only, no markdown.' },
            { sender_type: 'USER', sender_name: 'user', text: prompt },
          ],
          temperature: 0.2,
          tokens_to_generate: 900,
        }
      : {
          model: 'MiniMax-Text-01',
          messages: [
            { role: 'system', content: 'You are a 911 training evaluator. Reply with JSON only, no markdown.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 900,
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`MiniMax API ${response.status}:`, errText);
      return localEvaluate(transcript, scenarioTitle, scenarioId);
    }

    const data = await response.json();
    // Handle both response formats
    const content: string =
      data.choices?.[0]?.message?.content ||
      data.reply ||
      '';

    if (!content) {
      console.error('MiniMax empty response:', JSON.stringify(data));
      return localEvaluate(transcript, scenarioTitle, scenarioId);
    }

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as FeedbackResult;
    }

    return localEvaluate(transcript, scenarioTitle, scenarioId);
  } catch (err) {
    console.error('MiniMax failed:', err);
    return localEvaluate(transcript, scenarioTitle, scenarioId);
  }
}

// Scenario-aware local evaluator — checks every critical step, kills patient if missed
function localEvaluate(transcript: string, scenarioTitle: string, scenarioId: string): FeedbackResult {
  const hasContent = transcript.trim().split(/\s+/).filter(Boolean).length > 8;

  if (!hasContent) {
    return {
      outcome: 'dead',
      score: 0,
      good: [],
      bad: ['No operator speech detected'],
      fatal_errors: ['Operator did not respond to the caller'],
      summary: `No transcript captured. The patient received no guidance and did not survive.`,
      detailed_feedback: 'No operator speech was recorded. Ensure your microphone is enabled, VAPI is connected, and you speak clearly during the call.',
    };
  }

  // Extract only operator lines for evaluation
  const operatorLines = transcript
    .split('\n')
    .filter((line) => line.includes('OPERATOR:'))
    .map((line) => line.replace(/.*OPERATOR:\s*/i, '').toLowerCase())
    .join(' ');

  const evalText = operatorLines || transcript.toLowerCase();

  const criteria = SCENARIO_CRITERIA[scenarioId];

  const good: string[] = [];
  const bad: string[] = [];
  const fatal_errors: string[] = [];
  const missedCritical: string[] = [];

  if (criteria) {
    for (const step of criteria.critical) {
      if (step.patterns.test(evalText)) {
        good.push(step.label);
      } else {
        bad.push(`MISSED: ${step.label}`);
        missedCritical.push(step.label);
      }
    }
    for (const mistake of criteria.fatal) {
      if (mistake.patterns.test(evalText)) {
        fatal_errors.push(mistake.label);
      }
    }
  } else {
    // Generic fallback
    if (/where|location|address/.test(evalText)) good.push('Asked for location');
    else bad.push('MISSED: Did not ask for exact location');
    if (/help.*coming|ambulance|dispatch|sending/.test(evalText)) good.push('Confirmed help is coming');
    else bad.push('MISSED: Never confirmed ambulance is on the way');
    if (/calm|breathe|stay.*me|here with you/.test(evalText)) good.push('Reassured the caller');
    else bad.push('MISSED: Never reassured the caller');
  }

  // Outcome: dead if any critical step missed OR any fatal error committed
  const outcome: 'alive' | 'dead' =
    missedCritical.length > 0 || fatal_errors.length > 0 ? 'dead' : 'alive';

  // Score: start 100, -20 per missed critical, -35 per fatal error
  const score = Math.max(
    0,
    Math.min(100, 100 - missedCritical.length * 20 - fatal_errors.length * 35)
  );

  const missedList = missedCritical.length > 0
    ? `\n\nCRITICAL STEPS YOU MISSED:\n${missedCritical.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    : '';

  const fatalList = fatal_errors.length > 0
    ? `\n\nFATAL ERRORS:\n${fatal_errors.map((f) => `• ${f}`).join('\n')}`
    : '';

  const summary = outcome === 'dead'
    ? `PATIENT DECEASED. You missed ${missedCritical.length} critical step(s) during this ${scenarioTitle} call.${fatal_errors.length > 0 ? ` You also gave dangerous advice that directly harmed the patient.` : ''} In a real emergency this outcome would be irreversible.`
    : `Patient survived. You completed all critical steps in the ${scenarioTitle} scenario. Score: ${score}/100.`;

  const detailed = `EVALUATION — ${scenarioTitle.toUpperCase()}\n\nYou completed ${good.length} of ${(criteria?.critical.length ?? 3)} critical steps.${missedList}${fatalList}\n\nOperator performance review: Each missed step above represents a real-world failure point. In an actual ${scenarioTitle.toLowerCase()} emergency, the patient has minutes — sometimes seconds — to survive. Memorize the critical checklist for this scenario and practice until it is automatic within your first 15 seconds on the call.`;

  return { outcome, score, good, bad, fatal_errors, summary, detailed_feedback: detailed };
}
