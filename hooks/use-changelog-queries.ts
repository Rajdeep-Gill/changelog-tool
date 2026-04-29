"use client"

import { useQuery } from "@tanstack/react-query"

import type { ChangelogEntry } from "@/lib/changelog/types"

export const changelogQueryKeys = {
  all: ["changelog"] as const,
  list: () => [...changelogQueryKeys.all, "list"] as const,
  detail: (slug: string) => [...changelogQueryKeys.all, "detail", slug] as const,
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string }
    return j.error ?? res.statusText
  } catch {
    return res.statusText
  }
}

export async function fetchChangelogList(): Promise<ChangelogEntry[]> {
  const res = await fetch("/api/changelog")
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<ChangelogEntry[]>
}

export async function fetchChangelogEntry(
  slug: string
): Promise<ChangelogEntry | null> {
  const res = await fetch(`/api/changelog/${encodeURIComponent(slug)}`)
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  return res.json() as Promise<ChangelogEntry>
}

export function useChangelogEntries() {
  return useQuery({
    queryKey: changelogQueryKeys.list(),
    queryFn: fetchChangelogList,
  })
}

export function useChangelogEntry(slug: string) {
  return useQuery({
    queryKey: changelogQueryKeys.detail(slug),
    queryFn: () => fetchChangelogEntry(slug),
    enabled: Boolean(slug),
  })
}
