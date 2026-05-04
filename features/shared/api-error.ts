type ApiErrorPayload = {
  error?: string
  hint?: string
  message?: string
}

export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorPayload
    return body.hint ?? body.error ?? body.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}
