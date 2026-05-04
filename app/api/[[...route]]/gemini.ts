import { Hono } from "hono"
import { generateText } from "ai"

import {
  getGeminiApiKey,
  getGeminiModelId,
  getGoogleGenerativeAI,
} from "@/lib/server/google-gemini"

const gemini = new Hono().get("/gemini-health", async (c) => {
  getGeminiApiKey()

  const modelId = getGeminiModelId()
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
})

export default gemini
