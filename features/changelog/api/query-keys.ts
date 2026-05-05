import { normalizeChangelogListSearchQuery } from "@/lib/changelog/normalize-list-search-query"

export const changelogQueryKeys = {
  all: ["changelog"] as const,
  /** Prefix for invalidating every changelog list variant (any search). */
  lists: () => [...changelogQueryKeys.all, "list"] as const,
  list: (searchQuery = "") =>
    [
      ...changelogQueryKeys.lists(),
      normalizeChangelogListSearchQuery(searchQuery),
    ] as const,
  detail: (slug: string) =>
    [...changelogQueryKeys.all, "detail", slug] as const,
}
