import { NextResponse } from "next/server"

import { generateText } from "ai"

import {
  getGeminiApiKey,
  getGeminiModelId,
  getGoogleGenerativeAI,
} from "@/lib/server/google-gemini"

/**
 * GET /api/ai/gemini-health — quick check that the Gemini API key and model work.
 */
export async function GET() {
  try {
    getGeminiApiKey()
  } catch (e) {
    const message = e instanceof Error ? e.message : "Missing API key"
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }

  const modelId = getGeminiModelId()
  try {
    const googleAI = getGoogleGenerativeAI()
    const { text } = await generateText({
      model: googleAI(modelId),
      prompt: 'Reply with exactly the word "OK" and nothing else.',
      maxOutputTokens: 16,
    })
    return NextResponse.json({
      ok: true,
      model: modelId,
      reply: text.trim().slice(0, 50),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        ok: false,
        model: modelId,
        error: message,
      },
      { status: 502 }
    )
  }
}
