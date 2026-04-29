import { NextResponse } from "next/server"

import { createChangelogBodySchema } from "@/lib/changelog/api-schemas"
import {
  insertChangelogEntry,
  listChangelogEntries,
} from "@/lib/server/changelog-repository"

export async function GET() {
  try {
    const entries = await listChangelogEntries()
    return NextResponse.json(entries)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list changelogs"
    const status = message.includes("DATABASE_URL") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json()
    const parsed = createChangelogBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data
    const publishedAt = new Date(body.publishedAt)
    if (Number.isNaN(publishedAt.getTime())) {
      return NextResponse.json({ error: "Invalid publishedAt" }, { status: 400 })
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

    return NextResponse.json(entry, { status: 201 })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to create changelog"
    const status = message.includes("DATABASE_URL") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
