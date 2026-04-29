"use client"

import * as React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"

import { ChangelogEntryView } from "./changelog-entry-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useChangelogEntries,
  useChangelogEntry,
} from "@/hooks/use-changelog-queries"

type ChangelogEntryClientProps = {
  slug: string
}

export function ChangelogEntryClient({ slug }: ChangelogEntryClientProps) {
  const { data: entry, isPending, isError, error } = useChangelogEntry(slug)
  const { data: allEntries = [] } = useChangelogEntries()

  const related = React.useMemo(
    () => allEntries.filter((e) => e.slug !== slug).slice(0, 3),
    [allEntries, slug]
  )

  if (isPending) {
    return (
      <div className="min-h-svh bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Skeleton className="mb-6 h-6 w-2/3 max-w-sm" />
          <Skeleton className="mb-4 h-10 w-full max-w-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-svh bg-background px-4 py-16">
        <div className="mx-auto max-w-lg">
          <Alert variant="destructive">
            <AlertTitle>Could not load entry</AlertTitle>
            <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
          </Alert>
          <Button
            nativeButton={false}
            className="mt-6"
            render={<Link href="/changelog" />}
            variant="outline"
          >
            Back to changelog
          </Button>
        </div>
      </div>
    )
  }

  if (entry === null) {
    return (
      <div className="min-h-svh bg-background px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="text-lg font-medium text-foreground">Not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No changelog entry exists for this URL.
          </p>
          <Button
            nativeButton={false}
            className="mt-6"
            render={<Link href="/changelog" />}
            variant="outline"
          >
            Back to changelog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ChangelogEntryView
      entry={entry}
      related={related}
      formattedDate={format(parseISO(entry.publishedAt), "MMMM d, yyyy")}
    />
  )
}
