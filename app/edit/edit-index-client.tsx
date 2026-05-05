"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { useMemo } from "react"

import { groupEntriesByMonth } from "@/components/changelog/group-by-month"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useChangelogEntries } from "@/features/changelog/api/use-changelog-entries"
import { monthHeadingParts } from "@/lib/changelog/date-format"

function formatPublishedShort(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

export function EditIndexClient() {
  const { data, isError, error, isPending } = useChangelogEntries()
  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages]
  )
  const byMonth = groupEntriesByMonth(entries)

  if (isPending && entries.length === 0) {
    return (
      <div className="min-h-svh bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-6 flex min-h-8 w-full flex-wrap items-center">
            <ChangelogBreadcrumbs subPage="Edit" />
          </div>
          <header className="mb-10 sm:mb-12">
            <Skeleton className="h-9 w-[min(12rem,50vw)] max-w-xs" />
            <Skeleton className="mt-4 h-14 max-w-2xl rounded-lg" />
          </header>
          <div className="mt-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex min-h-8 w-full flex-wrap items-center">
          <ChangelogBreadcrumbs subPage="Edit" />
        </div>

        <header className="mb-10 sm:mb-12">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Edit an entry
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Choose a changelog post to update or remove. Changes sync to the
            public changelog immediately.
          </p>
        </header>

        {isError ? (
          <Alert variant="destructive" className="mb-5 py-2">
            <AlertTitle>Could not load entries</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Unknown error"}
            </AlertDescription>
          </Alert>
        ) : null}

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No entries yet.&nbsp;
            <Link
              href="/create"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-6">
            {byMonth.map((group) => {
              const { month, year } = monthHeadingParts(group.monthKey)
              return (
                <section
                  key={group.monthKey}
                  aria-labelledby={`edit-month-${group.monthKey}`}
                >
                  <h2
                    id={`edit-month-${group.monthKey}`}
                    className="border-b border-dashed border-border/70 pb-1.5 font-heading text-lg font-semibold text-balance text-foreground sm:text-xl"
                  >
                    {month} {year}
                  </h2>
                  <ul className="divide-y divide-dashed divide-border/70">
                    {group.entries.map((entry) => {
                      const published = formatPublishedShort(entry.publishedAt)
                      return (
                        <li key={entry.slug}>
                          <Link
                            href={`/edit/${encodeURIComponent(entry.slug)}`}
                            className="group -mx-1 flex items-start justify-between gap-4 px-1 py-2 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:gap-6 sm:py-1.5"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <span className="block leading-snug font-medium text-foreground group-hover:underline group-hover:underline-offset-2">
                                {entry.title}
                              </span>
                              <span className="block truncate font-mono text-xs text-muted-foreground">
                                {entry.slug}
                              </span>
                            </div>
                            <time
                              dateTime={entry.publishedAt}
                              className="shrink-0 text-right text-muted-foreground tabular-nums"
                            >
                              {published}
                            </time>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
