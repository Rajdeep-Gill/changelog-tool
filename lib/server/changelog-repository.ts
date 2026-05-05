import { and, desc, eq, ilike, lt, ne, or } from "drizzle-orm"

import { db } from "@/db/drizzle"
import {
  changelogEntries,
  type ChangelogEntryRow,
  type ChangelogSourceMeta,
} from "@/db/schema"
import type { ChangelogEntry } from "@/lib/changelog/types"
import { slugifyTitle } from "@/lib/slug"

export function rowToChangelogEntry(row: ChangelogEntryRow): ChangelogEntry {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: row.publishedAt.toISOString(),
    summary: row.summary,
    body: row.body,
    category: row.category ?? undefined,
    breaking: row.breaking,
    tags: row.tags ?? undefined,
  }
}

export type ChangelogListCursor = {
  publishedAt: Date
  slug: string
}

export type ListChangelogEntriesPageInput = {
  limit: number
  cursor?: ChangelogListCursor | null
  /** Case-insensitive substring match on title, summary, or body; caller trims / caps length. */
  search?: string | null
}

function escapeLikePattern(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
}

function entrySearchPredicate(trimmedSearch: string) {
  const pattern = `%${escapeLikePattern(trimmedSearch)}%`
  return or(
    ilike(changelogEntries.title, pattern),
    ilike(changelogEntries.summary, pattern),
    ilike(changelogEntries.body, pattern)
  )
}

export type ListChangelogEntriesPageResult = {
  items: ChangelogEntry[]
  nextCursor: ChangelogListCursor | null
}

async function resolveUniqueSlug(base: string): Promise<string> {
  const normalized = slugifyTitle(base)
  for (let counter = 0; counter < 200; counter += 1) {
    const candidate =
      counter === 0 ? normalized : `${normalized}-${counter}`
    const found = await db
      .select({ id: changelogEntries.id })
      .from(changelogEntries)
      .where(eq(changelogEntries.slug, candidate))
      .limit(1)
    if (found.length === 0) return candidate
  }
  throw new Error("Could not allocate a unique slug")
}

export async function listChangelogEntries(): Promise<ChangelogEntry[]> {
  const rows = await db
    .select()
    .from(changelogEntries)
    .orderBy(desc(changelogEntries.publishedAt))
  return rows.map(rowToChangelogEntry)
}

export async function listChangelogEntriesPage({
  limit,
  cursor,
  search,
}: ListChangelogEntriesPageInput): Promise<ListChangelogEntriesPageResult> {
  const trimmedSearch = search?.trim() ?? ""
  const cursorPredicate = cursor
    ? or(
        lt(changelogEntries.publishedAt, cursor.publishedAt),
        and(
          eq(changelogEntries.publishedAt, cursor.publishedAt),
          lt(changelogEntries.slug, cursor.slug)
        )
      )
    : undefined

  const searchPredicate =
    trimmedSearch.length > 0 ? entrySearchPredicate(trimmedSearch) : undefined

  const whereClause =
    cursorPredicate && searchPredicate
      ? and(cursorPredicate, searchPredicate)
      : cursorPredicate ?? searchPredicate

  const rows = await db
    .select()
    .from(changelogEntries)
    .where(whereClause)
    .orderBy(desc(changelogEntries.publishedAt), desc(changelogEntries.slug))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const lastRow = pageRows[pageRows.length - 1]

  return {
    items: pageRows.map(rowToChangelogEntry),
    nextCursor: hasMore
      ? {
          publishedAt: lastRow.publishedAt,
          slug: lastRow.slug,
        }
      : null,
  }
}

export async function getChangelogEntryBySlug(
  slug: string
): Promise<ChangelogEntry | null> {
  const rows = await db
    .select()
    .from(changelogEntries)
    .where(eq(changelogEntries.slug, slug))
    .limit(1)
  const row = rows[0]
  return row ? rowToChangelogEntry(row) : null
}

export async function insertChangelogEntry(input: {
  title: string
  summary: string
  body: string
  publishedAt: Date
  slug?: string
  category?: string | null
  breaking?: boolean
  tags?: string[] | null
  source?: ChangelogSourceMeta | null
}): Promise<ChangelogEntry> {
  const slug = await resolveUniqueSlug(
    input.slug ?? slugifyTitle(input.title)
  )
  const [row] = await db
    .insert(changelogEntries)
    .values({
      slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      publishedAt: input.publishedAt,
      category: input.category ?? null,
      breaking: input.breaking ?? false,
      tags: input.tags ?? null,
      source: input.source ?? null,
    })
    .returning()

  if (!row) {
    throw new Error("Insert failed")
  }

  return rowToChangelogEntry(row)
}

export type UpdateChangelogEntryResult =
  | { ok: true; entry: ChangelogEntry }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "slug_conflict" }

export async function updateChangelogEntryBySlug(
  existingSlug: string,
  input: {
    title?: string
    summary?: string
    body?: string
    publishedAt?: Date
    slug?: string
    category?: string | null
    breaking?: boolean
    tags?: string[] | null
    source?: ChangelogSourceMeta | null
  }
): Promise<UpdateChangelogEntryResult> {
  const rows = await db
    .select()
    .from(changelogEntries)
    .where(eq(changelogEntries.slug, existingSlug))
    .limit(1)
  const current = rows[0]
  if (!current) {
    return { ok: false, reason: "not_found" }
  }

  const updateValues: Partial<typeof changelogEntries.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) updateValues.title = input.title
  if (input.summary !== undefined) updateValues.summary = input.summary
  if (input.body !== undefined) updateValues.body = input.body
  if (input.publishedAt !== undefined) {
    updateValues.publishedAt = input.publishedAt
  }
  if (input.category !== undefined) updateValues.category = input.category
  if (input.breaking !== undefined) updateValues.breaking = input.breaking
  if (input.tags !== undefined) updateValues.tags = input.tags
  if (input.source !== undefined) updateValues.source = input.source

  if (input.slug !== undefined) {
    const normalized = slugifyTitle(input.slug)
    if (normalized !== current.slug) {
      const conflict = await db
        .select({ id: changelogEntries.id })
        .from(changelogEntries)
        .where(
          and(
            eq(changelogEntries.slug, normalized),
            ne(changelogEntries.id, current.id)
          )
        )
        .limit(1)
      if (conflict.length > 0) {
        return { ok: false, reason: "slug_conflict" }
      }
      updateValues.slug = normalized
    }
  }

  const [row] = await db
    .update(changelogEntries)
    .set(updateValues)
    .where(eq(changelogEntries.id, current.id))
    .returning()

  if (!row) {
    return { ok: false, reason: "not_found" }
  }

  return { ok: true, entry: rowToChangelogEntry(row) }
}

export async function deleteChangelogEntryBySlug(slug: string): Promise<boolean> {
  const deleted = await db
    .delete(changelogEntries)
    .where(eq(changelogEntries.slug, slug))
    .returning({ id: changelogEntries.id })
  return deleted.length > 0
}
