import { createGoogleGenerativeAI } from "@ai-sdk/google"

/**
 * Google AI Studio key: prefer GOOGLE_GENERATIVE_AI_API_KEY (@ai-sdk/google default),
 * accept GEMINI_API_KEY / GOOGLE_AI_API_KEY as aliases.
 */
export function getGeminiApiKey(): string {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_AI_API_KEY
  if (!key?.trim()) {
    throw new Error(
      "Set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) from Google AI Studio"
    )
  }
  return key.trim()
}

export function getGoogleGenerativeAI() {
  return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() })
}

/** Override with GEMINI_MODEL e.g. gemini-2.0-flash */
export function getGeminiModelId(): string {
  return (process.env.GEMINI_MODEL ?? "gemini-2.5-flash").trim()
}
