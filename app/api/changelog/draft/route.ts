import { NextResponse } from "next/server"

import { changelogDraftBodySchema } from "@/lib/changelog/api-schemas"
import { generateChangelogDraft } from "@/lib/server/draft-changelog"
import { fetchCommitsByShas } from "@/lib/server/github-commits"

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json()
    const parsed = changelogDraftBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data
    const shaMap = await fetchCommitsByShas({
      owner: body.owner,
      repo: body.repo,
      shas: body.commitShas,
    })

    const commits = body.commitShas
      .map((sha) => shaMap.get(sha))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))

    if (commits.length === 0) {
      return NextResponse.json(
        { error: "No matching commits found for the given SHAs" },
        { status: 400 }
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

    return NextResponse.json(draft)
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
    return NextResponse.json({ error: message }, { status })
  }
}
