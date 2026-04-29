import Link from "next/link"
import { format, parseISO } from "date-fns"

import { EntryTags } from "@/components/changelog/entry-tags"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChangelogEntry } from "@/lib/changelog/types"
import { cn } from "@/lib/utils"

import { changelogMonthSectionId, groupEntriesByMonth } from "./group-by-month"

function monthHeadingParts(monthKey: string) {
  const d = parseISO(`${monthKey}-01`)
  return {
    month: format(d, "MMMM"),
    year: format(d, "yyyy"),
  }
}

/** Dot vertical offset — push dots slightly below card title band */
const TIMELINE_DOT_OFFSET = "pt-4"

function ReadMoreChevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

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
    <div className={cn("relative", className)}>
      {groups.map((group) => {
        const { month, year } = monthHeadingParts(group.monthKey)

        return (
          <section
            key={group.monthKey}
            className="mb-12 scroll-mt-28 last:mb-0"
            id={changelogMonthSectionId(group.monthKey)}
          >
            <div className="sticky top-0 z-20 mb-8 bg-background/95 py-2 backdrop-blur-sm supports-backdrop-filter:bg-background/85">
              <div className="inline-flex w-fit max-w-full flex-col gap-1">
                <h2 className="font-heading text-[1.375rem] font-semibold tracking-tight text-balance text-foreground sm:text-[1.5rem]">
                  <span>{month}</span>
                  <span className="tabular-nums"> {year}</span>
                </h2>
                <div
                  className="h-[2px] w-full rounded-full bg-primary/45 dark:bg-primary/40"
                  aria-hidden
                />
              </div>
            </div>

          <div className="relative space-y-6">
            {/* Spine: starts at first dot center — pt-4 + half dot (~top-5); ends flush bottom */}
            {group.entries.length > 1 ? (
              <div
                className="pointer-events-none absolute bottom-0 left-[calc(3rem+0.75rem+0.625rem)] top-5 z-0 w-px -translate-x-1/2 bg-border sm:left-[calc(3.5rem+1rem+0.75rem)] sm:top-5.25"
                aria-hidden
              />
            ) : null}

            {group.entries.map((entry) => {
              const published = parseISO(entry.publishedAt)
              const monthShort = format(published, "MMM")
              const dayNum = format(published, "d")

              return (
              <article
                key={entry.slug}
                className="relative z-10 flex gap-3 sm:gap-4"
              >
                <time
                  className={cn(
                    "flex w-12 shrink-0 flex-col items-end justify-start sm:w-14",
                    TIMELINE_DOT_OFFSET
                  )}
                  dateTime={entry.publishedAt}
                >
                  <span className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {monthShort}
                  </span>
                  <span className="font-heading text-lg font-semibold tabular-nums leading-none tracking-tight text-foreground sm:text-xl">
                    {dayNum}
                  </span>
                </time>

                <div
                  className={cn(
                    "relative z-1 flex w-5 shrink-0 flex-col items-center sm:w-6",
                    TIMELINE_DOT_OFFSET
                  )}
                >
                  <span
                    className="mx-auto size-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_1px_var(--background)] ring-[3px] ring-background sm:size-2.5 sm:ring-4"
                    aria-hidden
                  />
                </div>

                <Card
                  className={cn(
                    "changelog-timeline-card group/timeline-card relative min-w-0 flex-1 gap-1.5 py-2",
                    "rounded-2xl border border-border/60 bg-linear-to-b from-card to-muted/20",
                    "shadow-sm shadow-black/4 ring-0",
                    "transition-[border-color,box-shadow,transform] duration-200 ease-out",
                    "hover:-translate-y-px hover:border-primary/15 hover:shadow-md hover:shadow-black/6",
                    "dark:shadow-black/25 dark:hover:border-primary/20 dark:hover:shadow-black/35"
                  )}
                >
                  <CardHeader className="gap-0 space-y-2 px-4 pb-1.5 pt-2 sm:px-5 sm:pb-2 sm:pt-2.5">
                    <CardTitle className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-balance sm:text-[1.125rem]">
                      <Link
                        href={`/changelog/${entry.slug}`}
                        className="text-foreground decoration-primary/20 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary/50"
                      >
                        {entry.title}
                      </Link>
                    </CardTitle>

                    {(entry.category || entry.breaking || entry.tags?.length) ? (
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {entry.category ? (
                          <Badge variant="secondary" className="font-normal">
                            {entry.category}
                          </Badge>
                        ) : null}
                        {entry.breaking ? (
                          <Badge variant="destructive">Breaking</Badge>
                        ) : null}
                        <EntryTags tags={entry.tags} />
                      </div>
                    ) : null}

                    <CardDescription className="text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">
                      {entry.summary}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter
                    className={cn(
                      "flex justify-end border-border/45 bg-transparent px-4 py-1.5 sm:px-5 sm:py-2",
                      "border-t border-dashed"
                    )}
                  >
                    <Link
                      href={`/changelog/${entry.slug}`}
                      className="group/read inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Release notes
                      <ReadMoreChevron className="size-3.5 shrink-0 opacity-80 transition-transform duration-200 group-hover/timeline-card:translate-x-0.5 group-hover/read:translate-x-0.5" />
                    </Link>
                  </CardFooter>
                </Card>
              </article>
              )
            })}
          </div>
        </section>
        )
      })}
    </div>
  )
}
