import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { githubCommitsQuerySchema } from "@/lib/changelog/api-schemas"
import { fetchRepoCommitsFiltered } from "@/lib/server/github-commits"

const github = new Hono().get(
  "/commits",
  zValidator("query", githubCommitsQuerySchema),
  async (c) => {
    const q = c.req.valid("query")
    const commits = await fetchRepoCommitsFiltered({
      owner: q.owner,
      repo: q.repo,
      sinceIso: q.since,
      untilIso: q.until,
      branch: q.sha,
    })
    return c.json({ commits })
  }
)

export default github
