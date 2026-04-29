"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"

import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { EntryTags } from "@/components/changelog/entry-tags"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import {
  changelogBreadcrumbRowClassName,
  changelogMainColumnClassName,
  changelogPageHeaderSectionClassName,
} from "@/components/changelog/layout-classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ChangelogEntry } from "@/lib/changelog/types"

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

type ChangelogEntryViewProps = {
  entry: ChangelogEntry
  related: ChangelogEntry[]
  formattedDate: string
}

export function ChangelogEntryView({
  entry,
  related,
  formattedDate,
}: ChangelogEntryViewProps) {
  return (
    <div className="min-h-svh bg-background">
      <div className={changelogMainColumnClassName}>
        <div className={changelogBreadcrumbRowClassName}>
          <ChangelogBreadcrumbs entryTitle={entry.title} />
        </div>

        <header className={changelogPageHeaderSectionClassName}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <time
              className="text-[0.9375rem] text-muted-foreground tabular-nums"
              dateTime={entry.publishedAt}
            >
              {formattedDate}
            </time>
            {entry.category ? <Badge variant="secondary">{entry.category}</Badge> : null}
            {entry.breaking ? <Badge variant="destructive">Breaking</Badge> : null}
            <EntryTags tags={entry.tags} />
          </div>
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {entry.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {entry.summary}
          </p>
        </header>

        <Separator className="mb-10" />

        <MarkdownBody className="pb-2">{entry.body}</MarkdownBody>

        <footer className="mt-14 sm:mt-16">
          {related.length > 0 ? (
            <section
              aria-labelledby="changelog-related-heading"
              className="mb-12 sm:mb-14"
            >
              <h2
                id="changelog-related-heading"
                className="mb-5 font-heading text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
              >
                More entries
              </h2>
              <ul className="space-y-3 border-l border-border/70 pl-5">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/changelog/${r.slug}`}
                      className="group/related inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[0.9375rem] leading-snug text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                    >
                      <span>{r.title}</span>
                      <span className="text-[0.6875rem] font-normal tracking-wide text-muted-foreground uppercase tabular-nums group-hover/related:text-muted-foreground/90">
                        {format(parseISO(r.publishedAt), "MMM d, yyyy")}
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

          <nav
            aria-label="Back to changelog index"
            className="mt-9 flex justify-start sm:mt-11"
          >
            <Button
              nativeButton={false}
              className="gap-2 ps-2 text-muted-foreground hover:text-foreground"
              render={<Link href="/changelog" />}
              variant="ghost"
            >
              <ChevronLeftIcon className="opacity-70 transition-transform group-hover/button:-translate-x-0.5 group-hover/button:opacity-100" />
              Back to changelog
            </Button>
          </nav>
        </footer>
      </div>
    </div>
  )
}
