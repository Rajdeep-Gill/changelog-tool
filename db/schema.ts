import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export type ChangelogSourceMeta = {
  owner?: string
  repo?: string
  branch?: string
  since?: string
  until?: string
  commitShas?: string[]
}

export const changelogEntries = pgTable("changelog_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  category: text("category"),
  breaking: boolean("breaking").notNull().default(false),
  tags: jsonb("tags").$type<string[] | null>(),
  source: jsonb("source").$type<ChangelogSourceMeta | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export type ChangelogEntryRow = typeof changelogEntries.$inferSelect
export type NewChangelogEntryRow = typeof changelogEntries.$inferInsert
