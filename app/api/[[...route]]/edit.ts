import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { revalidatePath } from "next/cache"
import type { z } from "zod"

import { patchChangelogBodySchema } from "@/lib/changelog/api-schemas"
import {
  deleteChangelogEntryBySlug,
  updateChangelogEntryBySlug,
} from "@/lib/server/changelog-repository"

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

const edit = new Hono()
  .patch(
    "/:slug",
    zValidator("json", patchChangelogBodySchema),
    async (c) => {
      const slug = c.req.param("slug")
      const patchInput = patchInputFromBody(c.req.valid("json"))
      const result = await updateChangelogEntryBySlug(slug, patchInput)
      if (!result.ok) {
        if (result.reason === "not_found") {
          return c.json({ error: "Not found" }, 404)
        }
        return c.json({ error: "Slug already in use" }, 409)
      }

      revalidatePath("/changelog")
      revalidatePath(`/changelog/${slug}`)
      revalidatePath(`/changelog/${result.entry.slug}`)

      return c.json(result.entry)
    }
  )
  .delete("/:slug", async (c) => {
    const slug = c.req.param("slug")
    const deleted = await deleteChangelogEntryBySlug(slug)
    if (!deleted) {
      return c.json({ error: "Not found" }, 404)
    }
    return c.body(null, 204)
  })

export default edit
