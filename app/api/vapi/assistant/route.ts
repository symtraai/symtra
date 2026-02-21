import { NextRequest, NextResponse } from 'next/server';
import { getScenario } from '@/lib/scenarios';
import { buildVapiAssistantConfig } from '@/lib/vapi';

export async function POST(req: NextRequest) {
  try {
    const { scenarioId } = await req.json();

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    const assistantConfig = buildVapiAssistantConfig(scenario);

    return NextResponse.json({ assistantConfig });
  } catch (err) {
    console.error('VAPI assistant config error:', err);
    return NextResponse.json({ error: 'Failed to build assistant config' }, { status: 500 });
  }
}
