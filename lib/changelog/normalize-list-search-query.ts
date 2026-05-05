export const CHANGELOG_LIST_SEARCH_MAX_LENGTH = 200

export function normalizeChangelogListSearchQuery(raw: string): string {
  return raw.trim().slice(0, CHANGELOG_LIST_SEARCH_MAX_LENGTH)
}
