// VAPI custom-llm proxy → MiniMax M.25
// VAPI calls this endpoint (OpenAI-compatible format) from their servers.
// We forward it to MiniMax so no OpenAI key is needed in VAPI.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey || !groupId) {
    return NextResponse.json({ error: 'MiniMax not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();

    // VAPI sends OpenAI-format. Forward to MiniMax GroupId endpoint.
    const response = await fetch(
      `https://api.minimax.io/v1/text/chatcompletion_v2?GroupId=${groupId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          // Convert OpenAI messages format to MiniMax format
          messages: (body.messages ?? []).map((m: { role: string; content: string }) => ({
            sender_type: m.role === 'user' ? 'USER' : m.role === 'system' ? 'SYSTEM' : 'BOT',
            sender_name: m.role,
            text: m.content,
          })),
          temperature: body.temperature ?? 0.8,
          tokens_to_generate: body.max_tokens ?? 500,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('MiniMax LLM proxy error:', err);
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }

    const data = await response.json();

    // Convert MiniMax response back to OpenAI format for VAPI
    const content = data.reply ?? data.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'abab6.5s-chat',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (err) {
    console.error('LLM proxy failed:', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
