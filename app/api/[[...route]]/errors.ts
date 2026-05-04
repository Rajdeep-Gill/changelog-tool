import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"

function messageFromUnknown(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function parseErrorMessage(error: unknown, fallback: string): string {
  return messageFromUnknown(error, fallback)
}

export function inferErrorStatus(message: string): ContentfulStatusCode {
  if (
    message.includes("DATABASE_URL") ||
    message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    message.includes("GEMINI_API_KEY") ||
    message.includes("Google AI Studio") ||
    message.includes("GITHUB_TOKEN") ||
    message.includes("not set")
  ) {
    return 503
  }

  if (message.includes("GitHub API 404")) {
    return 404
  }

  return 500
}

export function throwHttp(status: ContentfulStatusCode, message: string): never {
  throw new HTTPException(status, { message })
}
