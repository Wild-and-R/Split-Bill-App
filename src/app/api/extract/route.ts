import { anthropic } from '@/lib/anthropic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { rawText } = await req.json();

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [{ 
      role: "user", 
      content: `Extract items and prices from this receipt text into JSON format: ${rawText}` 
    }],
  });

  return NextResponse.json({ data: msg.content });
}