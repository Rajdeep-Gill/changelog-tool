import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { githubCommitsQuerySchema } from "@/lib/changelog/api-schemas"
import { fetchRepoCommitsFiltered } from "@/lib/server/github-commits"

const github = new Hono().get(
  "/commits",
  zValidator("query", githubCommitsQuerySchema),
  async (c) => {
    const q = c.req.valid("query")
    try {
      const commits = await fetchRepoCommitsFiltered({
        owner: q.owner,
        repo: q.repo,
        sinceIso: q.since,
        untilIso: q.until,
        branch: q.sha,
      })
      return c.json({ commits })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to fetch commits from GitHub"
      if (message.includes("GITHUB_TOKEN") || message.includes("not set")) {
        return c.json({ error: message }, 503)
      }
      if (message.includes("GitHub API 404")) {
        return c.json(
          {
            error: message,
            hint: `No repository at ${q.owner}/${q.repo}. Confirm the name on github.com (package names may differ, e.g. @octokit/rest lives in octokit/rest.js).`,
          },
          404
        )
      }
      return c.json({ error: message }, 500)
    }
  }
)

export default github
