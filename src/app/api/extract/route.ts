import { model } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();

    const prompt = `
      Extract items and prices from this messy OCR receipt text. 
      Return a JSON object with a key "items" which is an array of objects.
      Each object must have "name" (string) and "price" (number).
      Ignore logos or random symbols.
      
      Receipt Text: ${rawText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Failed to structure data" }, { status: 500 });
  }
}