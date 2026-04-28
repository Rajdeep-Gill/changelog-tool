export type ChangelogEntry = {
  slug: string
  title: string
  /** ISO 8601 date string */
  publishedAt: string
  summary: string
  body: string
  category?: string
  breaking?: boolean
  tags?: string[]
}
