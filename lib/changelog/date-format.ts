import { format, parseISO } from "date-fns"

type ChangelogDatePreset = "long" | "medium" | "monthShort" | "dayOfMonth"

const CHANGELOG_DATE_PRESET_FORMAT: Record<ChangelogDatePreset, string> = {
  long: "MMMM d, yyyy",
  medium: "MMM d, yyyy",
  monthShort: "MMM",
  dayOfMonth: "d",
}

export function formatChangelogDate(
  isoDate: string,
  preset: ChangelogDatePreset = "medium"
): string {
  return format(parseISO(isoDate), CHANGELOG_DATE_PRESET_FORMAT[preset])
}

export function monthHeadingParts(monthKey: string): {
  month: string
  year: string
} {
  const monthDate = parseISO(`${monthKey}-01`)
  return {
    month: format(monthDate, "MMMM"),
    year: format(monthDate, "yyyy"),
  }
}
