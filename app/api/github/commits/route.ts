import { NextResponse } from "next/server"

import { githubCommitsQuerySchema } from "@/lib/changelog/api-schemas"
import { fetchRepoCommitsFiltered } from "@/lib/server/github-commits"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const raw = {
    owner: url.searchParams.get("owner") ?? "",
    repo: url.searchParams.get("repo") ?? "",
    since: url.searchParams.get("since") ?? "",
    until: url.searchParams.get("until") ?? "",
    sha: url.searchParams.get("sha") ?? undefined,
  }

  const parsed = githubCommitsQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const q = parsed.data
  try {
    const commits = await fetchRepoCommitsFiltered({
      owner: q.owner,
      repo: q.repo,
      sinceIso: q.since,
      untilIso: q.until,
      branch: q.sha,
    })
    return NextResponse.json({ commits })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch commits from GitHub"
    if (message.includes("GITHUB_TOKEN") || message.includes("not set")) {
      return NextResponse.json({ error: message }, { status: 503 })
    }
    if (message.includes("GitHub API 404")) {
      return NextResponse.json(
        {
          error: message,
          hint: `No repository at ${q.owner}/${q.repo}. Confirm the name on github.com (package names may differ, e.g. @octokit/rest lives in octokit/rest.js).`,
        },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
