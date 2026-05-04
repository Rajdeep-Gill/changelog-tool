import { format, parseISO } from "date-fns"

const PUBLISHED_AT_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"

/**
 * Convert an ISO datetime string (or YYYY-MM-DD) into a datetime-local input value.
 */
export function formatPublishedAtLocal(isoString: string): string | null {
  try {
    const parsed = parseISO(
      isoString.length <= 10 ? `${isoString}T12:00:00` : isoString
    )
    if (Number.isNaN(parsed.getTime())) return null
    return format(parsed, PUBLISHED_AT_LOCAL_FORMAT)
  } catch {
    return null
  }
}

/**
 * Convert a datetime-local input value into an ISO datetime string.
 */
export function parsePublishedAtLocal(localValue: string): string | null {
  const parsed = new Date(localValue)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

