import { Hono } from "hono"
import { generateText } from "ai"

import {
  getGeminiApiKey,
  getGeminiModelId,
  getGoogleGenerativeAI,
} from "@/lib/server/google-gemini"

/** GET /api/ai/gemini-health — quick check that Gemini key and model work. */
const gemini = new Hono().get("/gemini-health", async (c) => {
  try {
    getGeminiApiKey()
  } catch (e) {
    const message = e instanceof Error ? e.message : "Missing API key"
    return c.json({ ok: false, error: message }, 503)
  }

  const modelId = getGeminiModelId()
  try {
    const googleAI = getGoogleGenerativeAI()
    const { text } = await generateText({
      model: googleAI(modelId),
      prompt: 'Reply with exactly the word "OK" and nothing else.',
      maxOutputTokens: 16,
    })
    return c.json({
      ok: true,
      model: modelId,
      reply: text.trim().slice(0, 50),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return c.json(
      {
        ok: false,
        model: modelId,
        error: message,
      },
      502
    )
  }
})

export default gemini
