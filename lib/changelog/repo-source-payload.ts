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

export function toLocalDateTimeIso(value: string): string | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return formatISO(parsed)
}
