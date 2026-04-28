import Link from "next/link"
import { format, parseISO } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ChangelogEntry } from "@/lib/changelog"
import { cn } from "@/lib/utils"

import { changelogMonthSectionId, groupEntriesByMonth } from "./group-by-month"

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

export function ChangelogTimeline({ entries, className }: ChangelogTimelineProps) {
  const groups = groupEntriesByMonth(entries)

  return (
    <div className={cn("relative", className)}>
      {groups.map((group) => (
        <section
          key={group.monthKey}
          className="mb-12 scroll-mt-28 last:mb-0"
          id={changelogMonthSectionId(group.monthKey)}
        >
          <div className="mb-6 flex items-center gap-3">
            <h2 className="shrink-0 text-sm font-medium tracking-tight text-foreground">
              {group.label}
            </h2>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-8">
            {group.entries.map((entry) => (
              <article key={entry.slug} className="flex gap-4 sm:gap-5">
                <div className="flex w-3 shrink-0 justify-center sm:w-3.5">
                  <span
                    className="mt-5 size-2 rounded-full bg-primary ring-4 ring-background"
                    aria-hidden
                  />
                </div>

                <Card
                  className={cn(
                    "changelog-timeline-card group/timeline-card relative min-w-0 flex-1",
                    "rounded-2xl border border-border/60 bg-linear-to-b from-card to-muted/25",
                    "shadow-sm shadow-black/[0.03] ring-0",
                    "transition-[box-shadow,border-color,transform] duration-200 ease-out",
                    "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md hover:shadow-black/[0.06]",
                    "dark:shadow-black/20 dark:hover:shadow-black/40"
                  )}
                >
                  <CardHeader className="gap-3.5 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <time
                        className="tabular-nums tracking-wide text-[0.6875rem] text-muted-foreground uppercase"
                        dateTime={entry.publishedAt}
                      >
                        {format(parseISO(entry.publishedAt), "MMMM d, yyyy")}
                      </time>
                      {entry.category ? (
                        <Badge variant="secondary">{entry.category}</Badge>
                      ) : null}
                      {entry.breaking ? (
                        <Badge variant="destructive">Breaking</Badge>
                      ) : null}
                    </div>
                    <CardTitle className="text-[1.0625rem] leading-snug font-semibold tracking-tight sm:text-lg">
                      <Link
                        href={`/changelog/${entry.slug}`}
                        className="text-foreground decoration-primary/0 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary/40"
                      >
                        {entry.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                      {entry.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter
                    className={cn(
                      "mt-0 flex justify-start border-border/50 bg-muted/40 px-5 py-5 sm:px-6",
                      "border-t"
                    )}
                  >
                    <Button
                      nativeButton={false}
                      className="gap-2 ps-3.5 pe-4"
                      render={<Link href={`/changelog/${entry.slug}`} />}
                      size="sm"
                      variant="outline"
                    >
                      Read more
                      <ReadMoreChevron className="opacity-70 transition-transform group-hover/timeline-card:translate-x-0.5" />
                    </Button>
                  </CardFooter>
                </Card>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
