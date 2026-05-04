import { endOfDay, formatISO, startOfDay } from "date-fns"

import { parseGithubRepoInput } from "@/lib/changelog/parse-github-repo-url"
import type { RepoWindowFormValues } from "@/lib/changelog/repo-window-form-schema"

type RepoSourceWindow = {
  owner: string
  repo: string
  branch?: string
  since: string
  until: string
}

export function buildRepoSourceWindow(
  values: RepoWindowFormValues
): RepoSourceWindow | null {
  const parsed = parseGithubRepoInput(values.repoUrl)
  if (!parsed) return null

  const branch = values.branch.trim()
  return {
    owner: parsed.owner,
    repo: parsed.repo,
    since: formatISO(startOfDay(values.dateFrom)),
    until: formatISO(endOfDay(values.dateTo)),
    ...(branch ? { branch } : {}),
  }
}

export type CreateChangelogSourcePayload = {
  owner: string
  repo: string
  branch?: string
  since: string
  until: string
  commitShas: string[]
}

/**
 * Build the optional `source` object for creating a changelog entry from the
 * repo window form and selected commit SHAs. Returns `null` if the repo URL is invalid.
 */
export function buildCreateSource(
  getRepoValues: () => RepoWindowFormValues,
  selected: ReadonlySet<string>
): CreateChangelogSourcePayload | null {
  const sourceWindow = buildRepoSourceWindow(getRepoValues())
  if (!sourceWindow) return null
  return {
    owner: sourceWindow.owner,
    repo: sourceWindow.repo,
    branch: sourceWindow.branch,
    since: sourceWindow.since,
    until: sourceWindow.until,
    commitShas: [...selected],
  }
}

export function toLocalDateTimeIso(value: string): string | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return formatISO(parsed)
}
