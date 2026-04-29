import { NextResponse } from "next/server"

import { getChangelogEntryBySlug } from "@/lib/server/changelog-repository"

type RouteParams = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params
    const entry = await getChangelogEntryBySlug(slug)
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load changelog entry"
    const status = message.includes("DATABASE_URL") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
