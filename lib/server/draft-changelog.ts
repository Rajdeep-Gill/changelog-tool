import { generateObject } from "ai"
import { z } from "zod"

import type { NormalizedGithubCommit } from "@/lib/server/github-commits"
import {
  getGeminiModelId,
  getGoogleGenerativeAI,
} from "@/lib/server/google-gemini"

const draftOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bodyMarkdown: z.string(),
  suggestedPublishedAt: z.string().optional(),
  category: z.string().optional(),
  breaking: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export type ChangelogDraftResult = z.infer<typeof draftOutputSchema>

const MAX_COMMIT_LINES = 60
const SUBJECT_MAX = 200
const BODY_INLINE_MAX = 400

function buildCommitContext(commits: NormalizedGithubCommit[]): string {
  const lines: string[] = []
  let n = 0
  for (const c of commits) {
    if (n >= MAX_COMMIT_LINES) break
    const subj = c.subject.slice(0, SUBJECT_MAX)
    const extra = c.body
      ? ` — ${c.body.replace(/\s+/g, " ").slice(0, BODY_INLINE_MAX)}`
      : ""
    lines.push(`- ${c.shortSha}: ${subj}${extra}`)
    n += 1
  }
  return lines.join("\n")
}

export async function generateChangelogDraft(input: {
  owner: string
  repo: string
  branch?: string
  since: string
  until: string
  commits: NormalizedGithubCommit[]
  additionalContext?: string
}): Promise<ChangelogDraftResult> {
  const googleAI = getGoogleGenerativeAI()
  const modelId = getGeminiModelId()

  const commitContext = buildCommitContext(input.commits)
  const trimmedContext = input.additionalContext?.trim()
  const extraInstructions = trimmedContext
    ? `\n\nAdditional instructions from the author:\n${trimmedContext}`
    : ""

  const prompt = `Repository ${input.owner}/${
    input.repo
  }${input.branch ? `, branch: ${input.branch}` : ""}.
Inclusive author-date window (ISO): ${input.since} through ${input.until}.

Selected commits (newest first in this list):
${commitContext}

Produce a concise changelog entry for end users and developers using the product/API.
- summary: 1–3 sentences, no SHAs.
- bodyMarkdown: Markdown with ## and ### headings, bullet lists where helpful; mention important behavior and migrations; avoid internal git jargon.
- suggestedPublishedAt: optional end-of-window date YYYY-MM-DD if it fits.
- tags: optional 1–5 short labels when clearly implied (e.g. Feature, Bug fix, Security, Documentation, Performance, Deprecation); omit if unsure.${extraInstructions}`

  const { object } = await generateObject({
    model: googleAI(modelId),
    schema: draftOutputSchema,
    system:
      "You write clear changelogs from git history. Stay faithful to the commits; do not invent features not implied by the messages.",
    prompt,
  })

  return object
}
