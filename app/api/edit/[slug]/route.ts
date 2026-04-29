import { NextResponse } from "next/server"
import type { z } from "zod"

import { patchChangelogBodySchema } from "@/lib/changelog/api-schemas"
import {
  deleteChangelogEntryBySlug,
  updateChangelogEntryBySlug,
} from "@/lib/server/changelog-repository"

/**
 * PATCH/DELETE changelog entries by slug.
 * Mutations are not authenticated; add auth before exposing publicly.
 */
type RouteParams = { params: Promise<{ slug: string }> }

type PatchBody = z.infer<typeof patchChangelogBodySchema>

function patchInputFromBody(body: PatchBody): Parameters<
  typeof updateChangelogEntryBySlug
>[1] {
  const input: Parameters<typeof updateChangelogEntryBySlug>[1] = {}
  if (body.title !== undefined) input.title = body.title
  if (body.summary !== undefined) input.summary = body.summary
  if (body.body !== undefined) input.body = body.body
  if (body.publishedAt !== undefined) {
    input.publishedAt = new Date(body.publishedAt)
  }
  if (body.slug !== undefined) input.slug = body.slug
  if (body.category !== undefined) input.category = body.category
  if (body.breaking !== undefined) input.breaking = body.breaking
  if (body.tags !== undefined) input.tags = body.tags
  if (body.source !== undefined) input.source = body.source
  return input
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params
    const json: unknown = await request.json()
    const parsed = patchChangelogBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const patchInput = patchInputFromBody(parsed.data)
    const result = await updateChangelogEntryBySlug(slug, patchInput)
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 }
      )
    }
    return NextResponse.json(result.entry)
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update changelog entry"
    const status = message.includes("DATABASE_URL") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params
    const deleted = await deleteChangelogEntryBySlug(slug)
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to delete changelog entry"
    const status = message.includes("DATABASE_URL") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
