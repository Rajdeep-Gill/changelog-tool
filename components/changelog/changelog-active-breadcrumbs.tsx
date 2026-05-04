"use client"

import { useSelectedLayoutSegment } from "next/navigation"

import { useChangelogEntry } from "@/features/changelog/api/use-changelog-entry"

import { ChangelogBreadcrumbs } from "./changelog-breadcrumbs"

export function ChangelogActiveBreadcrumbs() {
  const activeChildSegment = useSelectedLayoutSegment()
  const { data: activeEntry, isPending: isEntryPending } = useChangelogEntry(
    activeChildSegment ?? ""
  )

  const fallbackEntryTitle = activeChildSegment
    ? decodeURIComponent(activeChildSegment).replace(/-/g, " ")
    : undefined
  const entryTitle =
    activeEntry?.title ??
    (activeChildSegment && isEntryPending ? "..." : fallbackEntryTitle)

  return <ChangelogBreadcrumbs entryTitle={entryTitle} />
}