"use client"

import Link from "next/link"
import { CaretLeftIcon } from "@phosphor-icons/react"

import { useChangelogEntries } from "@/features/changelog/api/use-changelog-entries"
import { formatChangelogDate } from "@/lib/changelog/date-format"

type ChangelogEntryLayoutFooterProps = {
  slug: string
}

export function ChangelogEntryLayoutFooter({ slug }: ChangelogEntryLayoutFooterProps) {
  const { data, isPending } = useChangelogEntries()
  const allEntries =
    data?.pages.flatMap((page) => page.items) ?? []

  const related =
    isPending || allEntries.length === 0
      ? []
      : allEntries.filter((entry) => entry.slug !== slug).slice(0, 3)

  return (
    <footer className="mt-8 space-y-5 border-t border-border pt-10">
      {related.length > 0 ? (
        <section aria-labelledby="changelog-related-heading">
          <h2
            id="changelog-related-heading"
            className="border-b border-dashed border-border/70 pb-2 font-heading text-base font-semibold text-foreground"
          >
            More entries
          </h2>
          <ul className="divide-y divide-dashed divide-border/70">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/changelog/${entry.slug}`}
                  className="group -mx-2 flex flex-col gap-1 rounded-md px-2 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:py-3.5"
                >
                  <span className="min-w-0 font-medium leading-snug text-foreground group-hover:underline group-hover:underline-offset-2">
                    {entry.title}
                  </span>
                  <time
                    dateTime={entry.publishedAt}
                    className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-sm"
                  >
                    {formatChangelogDate(entry.publishedAt, "medium")}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Back to changelog index">
        <Link
          href="/changelog"
          className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CaretLeftIcon aria-hidden className="size-4 opacity-80" />
          Back to changelog
        </Link>
      </nav>
    </footer>
  )
}
