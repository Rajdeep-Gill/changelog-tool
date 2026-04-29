import { githubCommitItemSchema } from "@/lib/changelog/api-schemas"
import type { z } from "zod"

import { getOctokit } from "./github-octokit"

type GithubCommitApi = {
  sha: string
  commit: {
    message: string
    author: { date: string; name?: string; email?: string } | null
    committer: { date: string } | null
  }
  html_url: string
  author: { login: string } | null
}

function splitCommitMessage(message: string): { subject: string; body?: string } {
  const idx = message.indexOf("\n")
  if (idx === -1) {
    return { subject: message.trim(), body: undefined }
  }
  return {
    subject: message.slice(0, idx).trim(),
    body: message.slice(idx + 1).trim() || undefined,
  }
}

export type NormalizedGithubCommit = z.infer<typeof githubCommitItemSchema>

function normalizeCommit(c: GithubCommitApi): NormalizedGithubCommit {
  const date =
    c.commit.author?.date ??
    c.commit.committer?.date ??
    new Date(0).toISOString()
  const { subject, body } = splitCommitMessage(c.commit.message)
  return githubCommitItemSchema.parse({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    message: c.commit.message.trim(),
    subject,
    body,
    authorDate: date,
    htmlUrl: c.html_url,
    authorLogin: c.author?.login ?? null,
  })
}

function toGithubError(e: unknown): Error {
  if (!(e instanceof Error)) {
    return new Error(String(e))
  }
  const oe = e as Error & { status?: number; response?: { data?: unknown } }
  if (typeof oe.status === "number") {
    const data = oe.response?.data
    const extra =
      data !== undefined ? ` — ${JSON.stringify(data).slice(0, 200)}` : ""
    return new Error(`GitHub API ${oe.status}: ${oe.message}${extra}`)
  }
  return e
}

const MAX_COMMITS = 250
const PER_PAGE = 100

export async function fetchRepoCommitsFiltered(input: {
  owner: string
  repo: string
  sinceIso: string
  untilIso: string
  branch?: string
}): Promise<NormalizedGithubCommit[]> {
  const sinceMs = new Date(input.sinceIso).getTime()
  const untilMs = new Date(input.untilIso).getTime()

  if (Number.isNaN(sinceMs) || Number.isNaN(untilMs)) {
    throw new Error("Invalid since or until date")
  }

  const octokit = getOctokit()
  const results: NormalizedGithubCommit[] = []
  const seen = new Set<string>()

  for (let page = 1; page <= 10 && results.length < MAX_COMMITS; page += 1) {
    try {
      const { data } = await octokit.rest.repos.listCommits({
        owner: input.owner,
        repo: input.repo,
        ...(input.branch ? { sha: input.branch } : {}),
        since: input.sinceIso,
        until: input.untilIso,
        per_page: PER_PAGE,
        page,
      })

      if (data.length === 0) {
        break
      }

      let stoppedEarly = false
      for (const raw of data) {
        const c = raw as GithubCommitApi
        const n = normalizeCommit(c)
        const t = new Date(n.authorDate).getTime()
        if (t < sinceMs || t > untilMs) {
          continue
        }
        if (seen.has(n.sha)) continue
        seen.add(n.sha)
        results.push(n)
        if (results.length >= MAX_COMMITS) {
          stoppedEarly = true
          break
        }
      }

      if (stoppedEarly || data.length < PER_PAGE) {
        break
      }
    } catch (e) {
      throw toGithubError(e)
    }
  }

  results.sort(
    (a, b) =>
      new Date(b.authorDate).getTime() - new Date(a.authorDate).getTime()
  )

  return results
}

export async function fetchCommitsByShas(input: {
  owner: string
  repo: string
  shas: string[]
}): Promise<Map<string, NormalizedGithubCommit>> {
  const octokit = getOctokit()
  const map = new Map<string, NormalizedGithubCommit>()
  const unique = [...new Set(input.shas)]

  await Promise.all(
    unique.map(async (sha) => {
      try {
        const { data } = await octokit.rest.repos.getCommit({
          owner: input.owner,
          repo: input.repo,
          ref: sha,
        })
        map.set(sha, normalizeCommit(data as GithubCommitApi))
      } catch (e) {
        throw toGithubError(e)
      }
    })
  )

  return map
}
