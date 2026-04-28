import { sampleChangelogEntries } from "./sample-entries"
import type { ChangelogEntry } from "./types"

function byPublishedDesc(a: ChangelogEntry, b: ChangelogEntry): number {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

/**
 * Returns all entries newest-first. Replace implementation when wiring an API.
 */
export function getAllEntries(): ChangelogEntry[] {
  return [...sampleChangelogEntries].sort(byPublishedDesc)
}

export function getEntryBySlug(slug: string): ChangelogEntry | undefined {
  return sampleChangelogEntries.find((e) => e.slug === slug)
}

export function getStaticSlugs(): { slug: string }[] {
  return sampleChangelogEntries.map((e) => ({ slug: e.slug }))
}

export type { ChangelogEntry } from "./types"
