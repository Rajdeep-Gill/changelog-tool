"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"

import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import {
  changelogBreadcrumbRowClassName,
  changelogMainColumnClassName,
  changelogPageHeaderSectionClassName,
} from "@/components/changelog/layout-classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ChangelogEntry } from "@/lib/changelog"

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
          </div>
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {entry.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {entry.summary}
          </p>
        </header>

        <Separator className="mb-10" />

        <MarkdownBody className="pb-16">{entry.body}</MarkdownBody>

        {related.length > 0 ? (
          <footer className="border-t border-border pt-10">
            <h2 className="mb-4 text-sm font-medium text-foreground">More entries</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/changelog/${r.slug}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="ms-2 text-xs text-muted-foreground">
                    {format(parseISO(r.publishedAt), "MMM d, yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}

        <div className="pt-8">
          <Button
            nativeButton={false}
            render={<Link href="/changelog" />}
            variant="outline"
          >
            View all changelogs
          </Button>
        </div>
      </div>
    </div>
  )
}
