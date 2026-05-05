import Link from "next/link"

import { EntryTags } from "@/components/changelog/entry-tags"
import { Badge } from "@/components/ui/badge"
import type { ChangelogEntry } from "@/lib/changelog/types"
import {
  formatChangelogDate,
  monthHeadingParts,
} from "@/lib/changelog/date-format"
import { cn } from "@/lib/utils"

import { changelogMonthSectionId, groupEntriesByMonth } from "./group-by-month"

type ChangelogTimelineProps = {
  entries: ChangelogEntry[]
  className?: string
}

export function ChangelogTimeline({
  entries,
  className,
}: ChangelogTimelineProps) {
  const groups = groupEntriesByMonth(entries)

  return (
    <div className={cn("relative space-y-10", className)}>
      {groups.map((group) => {
        const { month, year } = monthHeadingParts(group.monthKey)

        return (
          <section
            key={group.monthKey}
            className="scroll-mt-28"
            id={changelogMonthSectionId(group.monthKey)}
            aria-labelledby={`changelog-timeline-month-${group.monthKey}`}
          >
            <h2
              id={`changelog-timeline-month-${group.monthKey}`}
              className="sticky top-0 z-1 border-b border-dashed bg-background py-5 font-heading text-lg font-semibold text-balance sm:text-xl"
            >
              {month} {year}
            </h2>
            <ul className="divide-y divide-dashed divide-border/70">
              {group.entries.map((entry) => {
                const published = formatChangelogDate(
                  entry.publishedAt,
                  "medium"
                )
                const hasMeta =
                  Boolean(entry.category) ||
                  Boolean(entry.breaking) ||
                  Boolean(entry.tags?.length)

                return (
                  <li key={entry.slug}>
                    <Link
                      href={`/changelog/${entry.slug}`}
                      className="group -mx-1 flex items-start justify-between gap-4 px-1 py-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:gap-6 sm:py-2"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="block text-sm leading-snug font-medium text-foreground group-hover:underline group-hover:underline-offset-2 sm:text-base">
                            {entry.title}
                          </span>
                          <time
                            dateTime={entry.publishedAt}
                            className="shrink-0 text-right text-muted-foreground tabular-nums"
                          >
                            {published}
                          </time>
                        </div>
                        {hasMeta ? (
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            {entry.category ? (
                              <Badge variant="secondary">
                                {entry.category}
                              </Badge>
                            ) : null}
                            {entry.breaking ? (
                              <Badge variant="destructive">Breaking</Badge>
                            ) : null}
                            <EntryTags tags={entry.tags} />
                          </div>
                        ) : null}
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          {entry.summary}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
