import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import {
  changelogDraftBodySchema,
  createChangelogBodySchema,
} from "@/lib/changelog/api-schemas"
import {
  getChangelogEntryBySlug,
  insertChangelogEntry,
  listChangelogEntriesPage,
} from "@/lib/server/changelog-repository"
import { generateChangelogDraft } from "@/lib/server/draft-changelog"
import { fetchCommitsByShas } from "@/lib/server/github-commits"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

type EncodedCursor = {
  publishedAt: string
  slug: string
}

function encodeCursor(cursor: EncodedCursor): string {
  return btoa(JSON.stringify(cursor))
}

function decodeCursor(cursor: string): EncodedCursor | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as Partial<EncodedCursor>
    if (
      typeof parsed?.publishedAt !== "string" ||
      typeof parsed?.slug !== "string"
    ) {
      return null
    }
    return { publishedAt: parsed.publishedAt, slug: parsed.slug }
  } catch {
    return null
  }
}

const changelog = new Hono()
  .get("/", async (c) => {
    const limitRaw = c.req.query("limit")
    const parsedLimit = Number.parseInt(limitRaw ?? "", 10)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

    const cursorRaw = c.req.query("cursor")
    const decodedCursor = cursorRaw ? decodeCursor(cursorRaw) : null

    if (cursorRaw && !decodedCursor) {
      return c.json({ error: "Invalid cursor" }, 400)
    }

    const cursorDate = decodedCursor ? new Date(decodedCursor.publishedAt) : null
    if (decodedCursor && Number.isNaN(cursorDate?.getTime())) {
      return c.json({ error: "Invalid cursor" }, 400)
    }

    try {
      const page = await listChangelogEntriesPage({
        limit,
        cursor: decodedCursor
          ? {
              publishedAt: cursorDate as Date,
              slug: decodedCursor.slug,
            }
          : null,
      })

      return c.json({
        items: page.items,
        nextCursor: page.nextCursor
          ? encodeCursor({
              publishedAt: page.nextCursor.publishedAt.toISOString(),
              slug: page.nextCursor.slug,
            })
          : null,
      })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to list changelogs"
      const status = message.includes("DATABASE_URL") ? 503 : 500
      return c.json({ error: message }, status)
    }
  })
  .post("/", zValidator("json", createChangelogBodySchema), async (c) => {
    try {
      const body = c.req.valid("json")
      const publishedAt = new Date(body.publishedAt)
      if (Number.isNaN(publishedAt.getTime())) {
        return c.json({ error: "Invalid publishedAt" }, 400)
      }

      const entry = await insertChangelogEntry({
        title: body.title,
        summary: body.summary,
        body: body.body,
        publishedAt,
        slug: body.slug,
        category: body.category,
        breaking: body.breaking,
        tags: body.tags ?? null,
        source: body.source ?? null,
      })

      return c.json(entry, 201)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create changelog"
      const status = message.includes("DATABASE_URL") ? 503 : 500
      return c.json({ error: message }, status)
    }
  })
  .post(
    "/draft",
    zValidator("json", changelogDraftBodySchema),
    async (c) => {
      try {
        const body = c.req.valid("json")
        const shaMap = await fetchCommitsByShas({
          owner: body.owner,
          repo: body.repo,
          shas: body.commitShas,
        })

        const commits = body.commitShas
          .map((sha) => shaMap.get(sha))
          .filter((it): it is NonNullable<typeof it> => Boolean(it))

        if (commits.length === 0) {
          return c.json(
            { error: "No matching commits found for the given SHAs" },
            400
          )
        }

        const draft = await generateChangelogDraft({
          owner: body.owner,
          repo: body.repo,
          branch: body.branch,
          since: body.since,
          until: body.until,
          commits,
          additionalContext: body.additionalContext,
        })

        return c.json(draft)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to generate changelog draft"
        const status =
          message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
          message.includes("GEMINI_API_KEY") ||
          message.includes("Google AI Studio") ||
          message.includes("GITHUB_TOKEN")
            ? 503
            : 500
        return c.json({ error: message }, status)
      }
    }
  )
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug")
    try {
      const entry = await getChangelogEntryBySlug(slug)
      if (!entry) {
        return c.json({ error: "Not found" }, 404)
      }
      return c.json(entry)
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load changelog entry"
      const status = message.includes("DATABASE_URL") ? 503 : 500
      return c.json({ error: message }, status)
    }
  })

export default changelog
