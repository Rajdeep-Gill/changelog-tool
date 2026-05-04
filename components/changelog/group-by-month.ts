import { format, parseISO, startOfMonth } from "date-fns"

import type { ChangelogEntry } from "@/lib/changelog/types"

export type ChangelogMonthGroup = {
  monthKey: string
  entries: ChangelogEntry[]
}

/** DOM id for scroll targets (`#changelog-YYYY-MM`). */
export function changelogMonthSectionId(monthKey: string): string {
  return `changelog-${monthKey}`
}

export function groupEntriesByMonth(entries: ChangelogEntry[]): ChangelogMonthGroup[] {
  const map = new Map<string, ChangelogEntry[]>()

  for (const entry of entries) {
    const d = parseISO(entry.publishedAt)
    const key = format(startOfMonth(d), "yyyy-MM")
    const list = map.get(key)
    if (list) list.push(entry)
    else map.set(key, [entry])
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, groupEntries]) => ({
      monthKey,
      entries: groupEntries.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    }))
}
