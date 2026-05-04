"use client"

import Link from "next/link"
import { CaretLeftIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
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
    <footer className="mt-14 sm:mt-16">
      {related.length > 0 ? (
        <section aria-labelledby="changelog-related-heading" className="mb-12 sm:mb-14">
          <h2
            id="changelog-related-heading"
            className="mb-5 font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase"
          >
            More entries
          </h2>
          <ul className="space-y-3 border-l border-border/70 pl-5">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/changelog/${entry.slug}`}
                  className="group/related inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm leading-snug text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  <span>{entry.title}</span>
                  <span className="text-xs font-normal tracking-wide text-muted-foreground uppercase tabular-nums group-hover/related:text-muted-foreground/90">
                    {formatChangelogDate(entry.publishedAt, "medium")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none h-px w-full bg-linear-to-r from-transparent via-border to-transparent"
      />

      <nav aria-label="Back to changelog index" className="mt-9 flex justify-start sm:mt-11">
        <Button
          nativeButton={false}
          className="gap-2 ps-2 text-muted-foreground hover:text-foreground"
          render={<Link href="/changelog" />}
          variant="ghost"
        >
          <CaretLeftIcon
            aria-hidden
            className="opacity-70 transition-transform group-hover/button:-translate-x-0.5 group-hover/button:opacity-100"
            size={16}
          />
          Back to changelog
        </Button>
      </nav>
    </footer>
  )
}
